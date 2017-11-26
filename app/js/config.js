scannerApp.config([
	'$routeProvider',
	function ($routeProvider) {
		$routeProvider.when('/scanner', {
			templateUrl: 'tpl/scanner.html',
			controller: 'ScannerCtrl'
		}).when('/filters', {
			templateUrl: 'tpl/filters.html',
			controller: 'FiltersCtrl'
		}).when('/settings', {
			templateUrl: 'tpl/settings.html',
			controller: 'SettingsCtrl'
		}).when('/about', {
			templateUrl: 'tpl/about.html',
			controller: 'AboutCtrl'
		}).otherwise({
			redirectTo: '/scanner'
		});
	}
]);
