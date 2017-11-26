var argv = require('yargs').argv;
var env = argv.env || 'development';

module.exports = function (paths) {
	return function finalizeTask() {
		return paths.srcDir.readAsync('package.json', 'json').then(function (manifest) {
			switch (env) {
				case 'production':
					manifest.window.toolbar = false;
				break;
				case 'development':
					manifest.name += '-dev';
				break;
			}
			return paths.destDir.writeAsync('package.json', manifest);
		});
	};
};