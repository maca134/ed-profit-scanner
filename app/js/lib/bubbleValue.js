const fp = require('path');
const request = require('request');
const async = require('async');
const extend = require('extend');
const systemValue = require('./systemvalue');
const edsm = require('./edsm');

const defaultOpt = {
	system: '',
	range: 25,
	ignore: [],

	// system value opt
	maxDistance: -1,
	minValue: -1,
	terraOnly: false,
	maxBodies: -1
};

function bubbleValue(opt, complete) {
	let options = extend({}, defaultOpt, opt);
	//console.log('bubble options: ', options);
	var cancelled = false;
	async.waterfall([
		function (next) {
			var range = 0;
			var rangeInterval = 5;
			async.doUntil(function (next) {
				if (cancelled)
					return next('cancelled');
				range += rangeInterval;
				console.log('Looking for systems within %sly of %s', range, options.system);
				async.waterfall([
					function (next) {
						edsm.sphereSystems(options.system, range - rangeInterval, range, next);
					},
					function (systems, next) {
						systems = systems.filter(s => s.distance > 0);
						if (options.ignore.length > 0) 
							systems = systems.filter(s => options.ignore.indexOf(s.name) === -1);
						async.mapLimit(systems, 5, function (system, next) {
							if (cancelled)
								return next('cancelled');
							systemValue({
								system: system.name,
								maxDistance: options.maxDistance,
								minValue: options.minValue,
								terraOnly: options.terraOnly,
								maxBodies: options.maxBodies
							}, function (err, data) {
								if (err)
									return next('Error getting system value for: ' + system.name + ' - ' + err);
								data.jumps = Math.ceil(system.distance / options.range);
								data.distance = system.distance;
								data.bodyCount = data.bodies.length;
								next(null, data);
							});
						}, next);
					},
					function (systems, next) {
						systems = systems.filter(s => s.bodies.length > 0);
						if (options.minSystemValue > -1)
							systems = systems.filter(s => s.total > options.minSystemValue);
						systems.sort((a, b) => b.systemRating - a.systemRating);
						systems = systems.slice(0, 10);
						process.nextTick(() => next(null, systems));
					}
				], next);
			}, function (systems) {
				return cancelled || systems.length > 0 || range > (rangeInterval * 20);
			}, next);
		},
	], complete);
	return function () {
		cancelled = true;
	};
}

module.exports = bubbleValue;

/*
bubbleValue({
	system: 'BPM 26940',
	range: 10,
	minSystemValue: 250000,
	// system value opt
	maxDistance: 1000,
	minBodyValue: -1,
	terraOnly: false,
	maxBodies: 4
}, function (err, bubble) {
	console.log(err, bubble);
});
*/

