scannerApp.factory('EDPSUserSettings', function () {
	var userSettings = require('./js/lib/userSettings');
	return {
		load: userSettings.load,
		get: userSettings.get,
		set: userSettings.set,
		mset: userSettings.mset,
		deleteall: userSettings.deleteall
	};
});

scannerApp.factory('EDPSScannedBodies', function () {
	var scannedBodies = require('./js/lib/scannedBodies');
	return {
		load: scannedBodies.load,
		add: scannedBodies.add,
		exists: scannedBodies.exists,
		deleteall: scannedBodies.deleteall
	};
});

scannerApp.factory('EDPSImportJournal', function () {
	return {
		run: require('./js/lib/importJournal')
	};
});

scannerApp.factory('EDPSJournalEvents', function () {
	return new (require('./js/lib/edEvents'))();
});