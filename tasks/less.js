var gulp = require('gulp');
var less = require('gulp-less');

module.exports = function (paths) {
	return function lessTask() {
		return gulp.src(paths.srcDir.path('css/main.less'))
			.pipe(less())
			.pipe(gulp.dest(paths.destDir.path('css')));
	};
};