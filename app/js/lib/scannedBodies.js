var fp = require('path');
var jetpack = require('fs-jetpack');

var scanned = [];
var scannedPath = fp.join(fp.dirname(process.execPath), 'data', 'scanned.json');

function write(complete) {
	jetpack.writeAsync(scannedPath, scanned).then(function () {
		complete();
	}).catch(function (e) {
		complete(e);
	});		
}

module.exports = {
	load: function (complete) {
		jetpack.readAsync(scannedPath, 'json').then(function (d) {
			scanned = d || [];
			complete();
		}).catch(function (e) {
			complete(e);
		});
	},
	add: function (body, complete) {
		var added = false;
		if (scanned.indexOf(body) === -1) {
			added = true;
			scanned.push(body);
		}
		write(e => complete(e, added));
	},
	madd: function (list, complete) {
		var added = 0;
		list.forEach(l => {
			if (scanned.indexOf(l) === -1) {
				added++;
				scanned.push(l);
			}
		});
		write(e => complete(e, added));
	},
	count: function () {
		return scanned.length;
	},
	exists: function (body) {
		return scanned.indexOf(body) !== -1;
	},
	deleteall: function (complete) {
		scanned = [];
		write(complete);
	}
};