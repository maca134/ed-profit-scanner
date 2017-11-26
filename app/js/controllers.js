var async = require('async');
var gui = require('nw.gui');
var scannedBodies = require('./js/lib/scannedBodies');
var userSettings = require('./js/lib/userSettings');
var systemValue = require('./js/lib/systemValue');
var bubbleValue = require('./js/lib/bubbleValue');
var updater = require('./js/lib/updater');
var bodyValue = require('./js/lib/bodyValue');
var starValue = require('./js/lib/starValue');

var defaults = {
	filter: {
		jumprange: 10,
		maxdistance: 100000,
		minbodyvalue: 0,
		terraonly: false,
		maxbodies: 100,
		minsystemvalue: 0,
	},
	settings: {
		systemBlacklist: '',
		edjpath: '',
	}
};

scannerApp.controller('MainCtrl', function ($scope, $rootScope, $timeout, EDPSUserSettings, EDPSScannedBodies, EDPSJournalEvents) {
	$rootScope.inprogress = true;
	$rootScope.currentSystem = false;
	$rootScope.estimatedTotal = 0;
	$rootScope.resetEstimatedTotal = function () {
		$rootScope.estimatedTotal = 0;
	};

	toastr.options.positionClass = 'toast-bottom-center';
	toastr.options.timeOut = 2000;
	EDPSJournalEvents.on('log', function (event) {
		switch (event.event) {
			case 'Scan':
				EDPSScannedBodies.add(event.BodyName, function (err) {
					if (err)
						return toastr.error('Error adding scanned body: ' + err);
					toastr.success(event.BodyName + ' Scanned');
					$rootScope.estimatedTotal += (event.StarType) ? 
						starValue(event.StarType || 'unknown', event.StellarMass) : 
						bodyValue(event.PlanetClass, event.MassEM, event.TerraformState && event.TerraformState === 'Terraformable');
				});
			break;
			case 'Location':
			case 'StartJump':
			case 'FSDJump':
			case 'SupercruiseEntry':
				if (event.StarSystem)
					$rootScope.$apply(() => $rootScope.currentSystem = event.StarSystem);
			break;
		}
	});
	async.waterfall([
		function (next) {
			$rootScope.inprogressStatus = 'Checking for update...';
			updater(e => $timeout(() => next(e), 500));
		},
		function (next) {
			$rootScope.inprogressStatus = 'Loading settings...';
			EDPSUserSettings.load(e => $timeout(() => next(e), 500));
		},
		function (next) {
			$rootScope.inprogressStatus = 'Loading scanned bodies...';
			EDPSScannedBodies.load(e => $timeout(() => next(e), 500));
		},
		function (next) {
			$rootScope.inprogressStatus = 'Loading complete...';
			$timeout(() => next(), 500);
		},
	], function (err) {
		if (err) {
			$rootScope.inprogressStatus = 'There was an error loading...';
		} else {
			$rootScope.inprogress = false;
		}
	});
});

scannerApp.controller('ScannerCtrl', function ($scope, $rootScope, EDPSUserSettings, EDPSJournalEvents, EDPSScannedBodies) {
	$scope.copyToClipboard = function (text) {
		gui.Clipboard.get().set(text);
		toastr.success('Copied To Clipboard');
	};
	$scope.addBodyToScanned = function (name) {
		if (!confirm('Are you sure you want to remove this body?'))
			return;
		EDPSScannedBodies.add(name, function (err) {
			if (err)
				return toastr.error('Error adding scanned body: ' + err);
			toastr.success(name + ' Added');
			loadSystemInfo($rootScope.currentSystem);
		});
	};
	var cancelBubbleSearch;
	function loadSystemInfo(system) {
		if (!system)
			return;
		if (cancelBubbleSearch)
			cancelBubbleSearch();
		$scope.loadingSystem = true;
		$scope.loadingBubble = true;
		systemValue({
			system: $rootScope.currentSystem,
			maxDistance: EDPSUserSettings.get('filter.maxdistance') || defaults.filter.maxdistance,
			minValue: EDPSUserSettings.get('filter.minbodyvalue') || defaults.filter.minbodyvalue,
			terraOnly: EDPSUserSettings.get('filter.terraonly') || defaults.filter.terraonly,
			maxBodies: EDPSUserSettings.get('filter.maxbodies') || defaults.filter.maxbodies
		}, (e, d) => {
			$scope.$apply(() => {
				$scope.system = d;
				$scope.loadingSystem = false;
			});
		});
		
		cancelBubbleSearch = bubbleValue({
			system: $rootScope.currentSystem,
			range: EDPSUserSettings.get('filter.jumprange') || defaults.filter.jumprange,
			ignore: (EDPSUserSettings.get('settings.systemBlacklist') || defaults.settings.systemBlacklist).split('\n').map(l => l.trim()).filter(l => l !== ''),
			maxDistance: EDPSUserSettings.get('filter.maxdistance') || defaults.filter.maxdistance,
			minValue: EDPSUserSettings.get('filter.minbodyvalue') || defaults.filter.minbodyvalue,
			terraOnly: EDPSUserSettings.get('filter.terraonly') || defaults.filter.terraonly,
			maxBodies: EDPSUserSettings.get('filter.maxbodies') || defaults.filter.maxbodies,
			minSystemValue: EDPSUserSettings.get('filter.minsystemvalue') || defaults.filter.minsystemvalue,
		}, (e, d) => {
			if (e && e !== 'cancelled') 
				toastr.error('Error getting bubble info: ' + e);
			$scope.$apply(() => {
				$scope.bubble = d || [];
				$scope.loadingBubble = false;
			});
		});
	}
	if (!$rootScope.currentSystem)
		loadSystemInfo($rootScope.currentSystem);
	$rootScope.$watch('currentSystem', (newValue, oldValue) => loadSystemInfo(newValue));

	var onEDEvent = function (event) {
		if (event.event == 'Scan')
			loadSystemInfo($rootScope.currentSystem);
	};
	EDPSJournalEvents.on('log', onEDEvent);
	$scope.$on('$destroy', function () {
		if (cancelBubbleSearch)
			cancelBubbleSearch();
		EDPSJournalEvents.removeListener('log', onEDEvent);
	});
});

scannerApp.controller('FiltersCtrl', function ($scope, EDPSUserSettings) {
	$scope.resetFilters = function () {
		$scope.jumprange = defaults.filter.jumprange;
		$scope.maxdistance = defaults.filter.maxdistance;
		$scope.minsystemvalue = defaults.filter.minsystemvalue;
		$scope.minbodyvalue = defaults.filter.minbodyvalue;
		$scope.maxbodies = defaults.filter.maxbodies;
		$scope.terraonly = defaults.filter.terraonly;
	};
	$scope.jumprange = EDPSUserSettings.get('filter.jumprange') || defaults.filter.jumprange;
	$scope.maxdistance = EDPSUserSettings.get('filter.maxdistance') || defaults.filter.maxdistance;
	$scope.minsystemvalue = EDPSUserSettings.get('filter.minsystemvalue') || defaults.filter.minsystemvalue;
	$scope.minbodyvalue = EDPSUserSettings.get('filter.minbodyvalue') || defaults.filter.minbodyvalue;
	$scope.maxbodies = EDPSUserSettings.get('filter.maxbodies') || defaults.filter.maxbodies;
	$scope.terraonly = EDPSUserSettings.get('filter.terraonly') || defaults.filter.terraonly;
	var existingFilters = JSON.stringify({
		'filter.jumprange': $scope.jumprange,
		'filter.maxdistance': $scope.maxdistance,
		'filter.minsystemvalue': $scope.minsystemvalue,
		'filter.minbodyvalue': $scope.minbodyvalue,
		'filter.maxbodies': $scope.maxbodies,
		'filter.terraonly': $scope.terraonly,
	});
	$scope.$on('$destroy', function () {
		var currentFilters = {
			'filter.jumprange': parseInt($scope.jumprange),
			'filter.maxdistance': parseInt($scope.maxdistance),
			'filter.minsystemvalue': parseInt($scope.minsystemvalue),
			'filter.minbodyvalue': parseInt($scope.minbodyvalue),
			'filter.maxbodies': parseInt($scope.maxbodies),
			'filter.terraonly': $scope.terraonly,
		};
		if (JSON.stringify(currentFilters) !== existingFilters) {
			EDPSUserSettings.mset(currentFilters, function (err) {
				if (err)
					return toastr.error('Error saving filters: ' + err);
				toastr.success('Filters Saved');
			});
		}
	});
});

scannerApp.controller('SettingsCtrl', function ($scope, $rootScope, EDPSUserSettings, EDPSImportJournal) {
	$scope.scannedSystems = scannedBodies.count();
	$scope.importEDJournal = function () {
		$rootScope.inprogress = true;
		$rootScope.inprogressStatus = 'Importing Journal';
		EDPSImportJournal.run(function (status) {
			$rootScope.$apply(() => $rootScope.inprogressStatus = status);
		}, function (err, added) {
			$rootScope.$apply(() => {
				$rootScope.inprogress = false;
				$scope.scannedSystems = scannedBodies.count();
			});
			if (err)
				return toastr.error('Error importing journal: ' + err);
			toastr.success('Added ' + added + ' scans to database.');
		});
	};
	$scope.deleteUserData = function () {
		if (!confirm('Are you sure you want to clear all user data?'))
			return;
		$rootScope.inprogress = true;
		$rootScope.inprogressStatus = 'Clearing User Data';
		async.parallel([
			n => scannedBodies.deleteall(n),
			n => userSettings.deleteall(n),		
		], function (err) {
			$rootScope.$apply(() => {
				$rootScope.inprogress = false;
				$scope.scannedSystems = scannedBodies.count();
			});
			if (err)
				return toastr.error('Error deleting user data: ' + err);
			toastr.success('User data deleted.');
		});
	};
	$scope.systemBlacklist = EDPSUserSettings.get('settings.systemBlacklist') || defaults.settings.systemBlacklist;
	$scope.edjpath = EDPSUserSettings.get('settings.edjpath') || defaults.settings.edjpath;
	var existingSettings = JSON.stringify({
		'settings.systemBlacklist': $scope.systemBlacklist,
		'settings.edjpath': $scope.edjpath,
	});
	function save() {
		var currentSettings = {
			'settings.systemBlacklist': $scope.systemBlacklist,
			'settings.edjpath': $scope.edjpath,
		};
		if (JSON.stringify(currentSettings) !== existingSettings) {
			EDPSUserSettings.mset(currentSettings, function (err) {
				if (err)
					return toastr.error('Error saving settings: ' + err);
				toastr.success('Settings Saved');
			});
		}
	}
	$scope.save = function () {
		save();
	};
	$scope.$on('$destroy', function () {
		save();
	});
});

scannerApp.controller('AboutCtrl', function ($scope) {});