const fp = require('path');
const crypto = require('crypto');
const async = require('async');
const request = require('request');
const jetpack = require('fs-jetpack');

const cachepath = fp.join(fp.dirname(process.execPath), 'cache');
const cachettl = 86400000 * 30; // 30 days
jetpack.dir(cachepath);

function cachedRequest(url, qs, complete) {
	let cachefile = fp.join(cachepath, crypto.createHash('md5').update(url + '-' + JSON.stringify(qs)).digest("hex") + '.json');
	async.waterfall([
		function (next) {
			jetpack.readAsync(cachefile, 'json').then(d => next(null, d)).catch(e => next(e));
		},
		function (data, next) {
			if (!data)
				return next('no cache');
			if ((((new Date()).getTime()) - data.time) > cachettl)
				return next('expired');
			process.nextTick(() => next(null, data.content));
		}
	], function (err, data) {
		if (err) {
			//console.log('cache bad: %s', err);
			return request({
				method: 'GET',
				url: url,
				qs: qs
			}, function (err, res, body) {
				if (err || res.statusCode !== 200)
					return complete(err || 'HTTP ' + res.statusCode);
				try {
					let json = JSON.parse(body);
					jetpack.writeAsync(cachefile, {time: new Date().getTime(), content: json}).then(() => complete(null, json));
				} catch (e) {
					complete(e);
				}
			});
		}
		complete(null, data);
	});
}

function systeminfo(systemName, complete) {
	//https://www.edsm.net/api-v1/system
	cachedRequest('https://www.edsm.net/api-v1/system', {
		systemName: systemName,
		showInformation: 1,
	}, complete);
}

function bodies(systemName, complete) {
	//https://www.edsm.net/api-system-v1/bodies
	cachedRequest('https://www.edsm.net/api-system-v1/bodies', {
		systemName: systemName
	}, complete);
}

function sphereSystems(systemName, minRadius, maxRadius, complete) {
	//https://www.edsm.net/api-v1/sphere-systems
	cachedRequest('https://www.edsm.net/api-v1/sphere-systems', {
		systemName: systemName,
		radius: maxRadius,
		minRadius: minRadius
	}, complete);
}

module.exports = {
	bodies: bodies,
	sphereSystems: sphereSystems,
	systeminfo: systeminfo,
};