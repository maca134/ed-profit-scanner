var request = require('request');
var async = require('async');
var childProcess = require('child_process');
var jetpack = require('fs-jetpack');
var GitHubApi = require('github');

module.exports = function (paths) {
	var github = new GitHubApi({
	    version: '3.0.0',
	    timeout: 5000,
	    headers: {
	        'user-agent': 'ed-profit-scanner-builder'
	    }
	});
	github.authenticate({
	    type: 'oauth',
	    token: process.env.GITHUB_TOKEN
	});
	return function uploadTask(complete) {
		var manifest;
		async.waterfall([
			function (next) {
				console.log('reading manifest');
				jetpack.readAsync(paths.destDir.path('package.json'), 'json').then(d => next(null, d)).catch(e => next(e));
			},
			function (m, next) {
				console.log('git commit');
				manifest = m;
				childProcess.exec('git commit -am "autocommit version ' + manifest.version + '"', e => next(e));
			},
			function (next) {
				console.log('git push');
				childProcess.exec('git push', e => next(e));
			},
			function (next) {
				console.log('git release');
				// do release...
				github.repos.createRelease({
                    owner: 'maca134',
                    repo: 'ed-profit-scanner',
                    tag_name: manifest.version,
                    name: manifest.version,
                    body: ''
				}, (e, r) => next(e, r));
			},
			function (response, next) {
				var release = response.data;
				async.waterfall([
					function (next) {
						console.log('git release uploading update');
						github.repos.uploadAsset({
		                    owner: 'maca134',
		                    repo: 'ed-profit-scanner',
		                    id: release.id,
		                    filePath: paths.releasesDir.path(manifest.name + '-' + manifest.version + '_update.zip'),
		                    name: manifest.name + '_update.zip'
						}, next);
					},
					function (next) {
						console.log('git release uploading installer');
						github.repos.uploadAsset({
		                    owner: 'maca134',
		                    repo: 'ed-profit-scanner',
		                    id: release.id,
		                    filePath: paths.releasesDir.path(manifest.name + '-' + manifest.version + '_installer.exe'),
		                    name: manifest.name + '_installer.exe'
						}, e => next(e));
					},
				], e => next(e));
			},
		], complete);
	};
};