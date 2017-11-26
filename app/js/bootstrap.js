nw.Window.get().on('new-win-policy', function (frame, url, policy) {
	policy.ignore();
	nw.Shell.openExternal(url);
});

var scannerApp = angular.module('scannerApp', [
    'ngRoute',
    'ui.bootstrap',
    'ui.bootstrap-slider'
]);

//=require "config.js"
//=require "directives.js"
//=require "services.js"
//=require "controllers.js"