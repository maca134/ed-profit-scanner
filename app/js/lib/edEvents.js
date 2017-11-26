const EventEmitter = require('events').EventEmitter;
const jetpack = require('fs-jetpack');
const async = require('async');
const getEDJournalFiles = require('./getEDJournalFiles');

module.exports = class EDEvents extends EventEmitter {
	constructor () {
		super();
		let self = this;
		this.bind();
		this.checkInterval = 1000;
		this.journalMD5 = '';
		this.journalLastLog = new Date();
		self.checkJournal();
	}
	bind () {
		this.checkJournal = this.checkJournal.bind(this);
	}
	checkJournal () {
		let self = this;
		async.waterfall([
			function (next) {
				getEDJournalFiles(next);
			},
			function (files, next) {
				if (files.length === 0) 
					return next('no journals');
				var latest = files[files.length - 1];
				if (self.journalMD5 === latest.md5) 
					return next('nothing has changed');
				self.journalMD5 = latest.md5;
				self.processJournal(latest, next);
			},
		], function (err) {
			self.timeout = setTimeout(self.checkJournal, self.checkInterval);
		});
	}
	processJournal (file, complete) {
		let self = this;
		jetpack.readAsync(file.file).then(function (file) {
			file.split('\n')
				.filter(d => d != '')
				.map(d => JSON.parse(d, (k, v) => (k === 'timestamp') ? new Date(v) : v))
				.filter(d => d.timestamp > self.journalLastLog)
				.forEach(e => {
					self.journalLastLog = e.timestamp;
					self.emit('log', e);
				});
			complete();
		}).catch(e => complete(e));
	}
};