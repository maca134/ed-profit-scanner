const fp = require('path');
const async = require('async');
const extend = require('extend');
const edsm = require('./edsm');
const scannedBodies = require('./scannedBodies');
const bodyValue = require('./bodyValue');
const starValue = require('./starValue');

const defaultOpt = {
	system: '',
	maxDistance: -1,
	minValue: -1,
	terraOnly: false,
	maxBodies: -1,
	ignoreScanned: true
};

function systemValue(opt, complete) {
	let options = extend({}, defaultOpt, opt);
	//console.log('system options: ', options);
	async.waterfall([
		function (next) {
			edsm.systeminfo(options.system, next);
		},
		function (info, next) {
			if (!Array.isArray(info.information)) {
				return next(null, []);
			}
			edsm.bodies(options.system, (err, res) => {
				if (err)
					return next(err);
				next(null, res.bodies || []);
			});
		},
		function (bodies, next) {
			let bodyTotals = bodies;
			if (options.maxDistance > -1)
				bodyTotals = bodyTotals.filter(b => b.distanceToArrival < options.maxDistance);
			if (options.ignoreScanned)
				bodyTotals = bodyTotals.filter(b => !scannedBodies.exists(b.name));
			bodyTotals = bodyTotals.map(b => {
				let value = 0;
				let mass = 0;
				switch (b.type) {
					case 'Star':
						value = starValue(b.subType || 'unknown', b.solarMasses);
						mass = b.solarMasses;
					break;
					case 'Planet':
						value = bodyValue(b.subType, b.earthMasses, b.terraformingState && b.terraformingState === 'Candidate for terraforming');
						mass = b.earthMasses;
					break;
				}
				let body = {
					shortname: b.name.replace(options.system, '').trim(),
					name: b.name,
					distance: b.distanceToArrival,
					type: b.type,
					subType: b.subType,
					terraforming: b.terraformingState === 'Candidate for terraforming',
					value: Math.round(value)
				};
				if (body.shortname == '')
					body.shortname = 'Main Star';
				return body;
			});
			if (options.minValue > -1)
				bodyTotals = bodyTotals.filter(b => b.value > options.minValue);
			if (options.terraOnly)
				bodyTotals = bodyTotals.filter(b => b.terraforming);
			bodyTotals.sort((a, b) => b.value - a.value);
			if (options.maxBodies > -1)
				bodyTotals = bodyTotals.slice(0, options.maxBodies);
			
			let systemTotal = Math.round(bodyTotals.map(b => b.value).reduce((p,c) => p+c, 0));
			process.nextTick(() => next(null, {
				system: options.system,
				total: systemTotal,
				systemRating: bodyTotals.length > 0 ? systemTotal / bodyTotals.length : 0,
				bodies: bodyTotals,
				maxSystemTravel: bodyTotals.map(b => b.distance * 2).reduce((p,c) => p+c, 0)
			}));
		}
	], complete);
}





module.exports = systemValue;