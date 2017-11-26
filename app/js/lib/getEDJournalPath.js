var fp = require('path');
var async = require('async');
var childProcess = require('child_process');
var userSettings = require('./userSettings');

var edjournalpath;

function getEDJournalPath(complete) {
	var edjpath = userSettings.get('settings.edjpath');
	if (edjpath && edjpath !== '')
		return complete(null, edjpath);
	if (edjournalpath)
		return complete(null, edjournalpath);
	async.waterfall([
		function (next) {
			var cmd = 'reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders" /v Personal';
			childProcess.exec(cmd, function (err, stdout) {
				if (err)
					return next(err);
				var mydocs = fp.join(stdout.split('\r\n').map(l => l.trim()).filter(l => l != '')[1].split('    ')[2], '..', 'Saved Games', 'Frontier Developments', 'Elite Dangerous');
				next(null, mydocs);
			});
		},
		function (mydocs, next) {
			childProcess.exec('echo ' + mydocs, function (err, stdout) {
				if (err)
					return next(err);
				edjournalpath = stdout.split('\r\n')[0];
				next(null, edjournalpath);
			});
		},
	], complete);
}

module.exports = getEDJournalPath;