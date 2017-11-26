var gulp = require('gulp');
var jetpack = require('fs-jetpack');

var paths = {};
paths.projectDir = jetpack;
paths.srcDir = paths.projectDir.cwd('./app');
paths.destDir = paths.projectDir.cwd('./build');
paths.tmpDir = paths.projectDir.cwd('./tmp');
paths.releasesDir = paths.projectDir.cwd('./releases');

var cleanTask = require('./tasks/clean')(paths);
var copyTask = require('./tasks/copy')(paths);
var lessTask = require('./tasks/less')(paths);
var jsTask = require('./tasks/js')(paths);
var finalizeTask = require('./tasks/finalize')(paths);
var runTask = require('./tasks/run')(paths);
var releaseTask = require('./tasks/release')(paths);
var uploadTask = require('./tasks/upload')(paths);

gulp.task('clean', cleanTask);
gulp.task('copy', ['clean'], copyTask);
gulp.task('less', ['clean'], lessTask);
gulp.task('js', ['clean'], jsTask);
gulp.task('finalize', ['copy', 'less', 'js'], finalizeTask);
gulp.task('build', ['finalize']);
gulp.task('run', runTask);
gulp.task('buildrun', ['build'], runTask);
gulp.task('release', ['build'], releaseTask);
gulp.task('upload', ['release'], uploadTask);