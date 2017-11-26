module.exports = function (paths) {
	return function cleanTask() {
		return paths.destDir.dirAsync('.', {empty: true});
	};
};