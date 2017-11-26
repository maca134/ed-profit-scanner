var fp = require('path');
var jetpack = require('fs-jetpack');

var settings = {};
var settingsPath = fp.join(fp.dirname(process.execPath), 'data', 'usersettings.json');

function write(complete) {
	jetpack.writeAsync(settingsPath, settings).then(function () {
		complete();
	}).catch(function (e) {
		complete(e);
	});		
}

module.exports = {
	load: function (complete) {
		jetpack.readAsync(settingsPath, 'json').then(function (d) {
			settings = d || {};
			complete();
		}).catch(function (e) {
			complete(e);
		});
	},
	get: function (key) {
		return settings[key] || false;
	},
	set: function (key, val, complete) {
		settings[key] = val;
		write(complete);
	},
	mset: function (data, complete) {
		Object.keys(data).forEach(function (key) {
			settings[key] = data[key];
		});
		write(complete);
	},
	deleteall: function (complete) {
		settings = {};
		write(complete);
	}
};