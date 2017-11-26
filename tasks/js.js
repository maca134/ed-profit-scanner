var gulp = require('gulp');
var include = require('gulp-include');

module.exports = function (paths) {
	return function jsTask() {
		return gulp.src(paths.srcDir.path('js/bootstrap.js'))
			.pipe(include())
			.pipe(gulp.dest(paths.destDir.path('js')));
	};
};