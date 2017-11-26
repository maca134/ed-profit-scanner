var os = require('os');
var path = require('path');
var spawn = require('child_process').spawn;
var jetpack = require('fs-jetpack');
var request = require('request');
var async = require('async');
var localversion = nw.App.manifest.version;
var nwPath = path.dirname(process.argv[0]);

module.exports = function updater(complete) {
	request('https://api.github.com/repos/maca134/ed-profit-scanner/releases', {
		headers: {
			'User-Agent': 'ed-profit-scanner'
		}
	}, function (err, res, body) {
		if (err) {
			alert('There was an error checking for updates: ' + err);
			return complete();
		}
		var release;
		try {
			release = JSON.parse(body);
		} catch (e) {
			alert('There was an error checking for updates: ' + e);
			return complete();
		}
		if (Array.isArray(release))
			release = release[0];
		
		if (release.assets.length === 0)
			return complete();

		if (release.tag_name === localversion)
			return complete();
		if (!confirm('There is an update, would you like to download it now?'))
			return complete();
		var updater = path.join(nwPath, 'updater.exe');
		if (jetpack.exists(updater) != 'file') {
			alert('Updater not found. Please update manually!');
			return complete();
		}
		// do update
		var updateurl = release.assets.find(a => a.name === nw.App.manifest.name + '_update.zip');
		if (!updateurl) {
			alert('Unable to find update archive, please update manually!');
			return complete();
		}
		var tmpupdater = path.join(os.tmpdir(), 'updater.exe');
		if (jetpack.exists(tmpupdater) == 'file')
			jetpack.remove(tmpupdater);
		jetpack.copy(updater, tmpupdater);
		spawn(tmpupdater, [nwPath, updateurl.browser_download_url, nw.App.manifest.name], {detached: true});
		nw.App.quit();
	});
};