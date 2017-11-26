var fp = require('path');
var async = require('async');
var jetpack = require('fs-jetpack');
var getEDJournalPath = require('./getEDJournalPath');

function getEDJournalFiles(complete) {
	var journalPath;
	async.waterfall([
		function (next) {
			getEDJournalPath(next);
		},
		function (path, next) {
			journalPath = path;
			jetpack.findAsync(path, {
				matching: 'Journal.*.log'
			}).then(l => next(null, l)).catch(e => next(e));
		},
		function (files, next) {
			async.map(files, function (file, next) {
				jetpack.inspectAsync(file, {
					checksum: 'md5',
					times: true
				}).then(i => next(null, i)).catch(e => next(e));
			}, next);
		},
		function (files, next) {
			files = files.map(f => {
				f.file = fp.join(journalPath, f.name);
				return f;
			});
			files.sort((a, b) => a.modifyTime - b.modifyTime);
			process.nextTick(() => next(null, files));
		},
	], complete);
}

module.exports = getEDJournalFiles;