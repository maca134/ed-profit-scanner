var childProcess = require('child_process');
var async = require('async');
var nwjs = require('nwjs-downloader');
var jetpack = require('fs-jetpack');

module.exports = function (paths) {
	return function runTask(complete) {
		async.waterfall([
			function (next) {
				jetpack.readAsync(paths.destDir.path('package.json'), 'json').then(d => next(null, d)).catch(e => next(e));
			},
			function (manifest, next) {
				nwjs({
					version: manifest.nwjs.version,
					arch: manifest.nwjs.arch,
					sdk: manifest.nwjs.sdk,
				}, next);
			},
			function (exe, next) {
				childProcess.spawn(exe, [paths.destDir.path('.')], {
					stdio: 'inherit'
				}).on('close', function () {
					next();
				});
			},
		], complete);
	};
};