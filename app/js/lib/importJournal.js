var fp = require('path');
var childProcess = require('child_process');
var util = require('util');
var jetpack = require('fs-jetpack');
var async = require('async');
var split = require('split');
var scannedBodies = require('./scannedBodies');
var getEDJournalFiles = require('./getEDJournalFiles');
var countLinesInFile = require('./countLinesInFile');

function importJournal(update, complete) {
	var journalPath;
	async.waterfall([
		function (next) {
			getEDJournalFiles(next);
		},
		function (files, next) {
			async.map(files, function (file, next) {
				countLinesInFile(file.file, function (err, lines) {
					if (err)
						return next(err);
					file.lines = lines;
					next(null, file);
				});
			}, next);
		},
		function (files, next) {
			var totalLines = files.reduce((p, l) => p+l.lines, 0);
			var linesComplete = 0;
			var bodies = [];
			async.eachSeries(files, function (file, next) {
				var readError;
				jetpack.createReadStream(file.file).pipe(split()).on('data', function (line) {
					linesComplete++;
					if (linesComplete % 50)
						update(util.format('%s of %s lines done', linesComplete, totalLines));
					var data;
					try {
						data = JSON.parse(line);
					} catch (e) {
						return;
					}
					if (data.event !== 'Scan')
						return;
					bodies.push(data.BodyName);
				}).on('end', function () {
					next();
				}).on('error', function (err) {
					readError = true;
					next(err);
				});
			}, e => next(e, bodies));
		},
		function (bodies, next) {
			scannedBodies.madd(bodies, (e, a) => next(null, a));
		}
	], complete);
}

module.exports = importJournal;