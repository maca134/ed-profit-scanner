var fp = require('path');
var childProcess = require('child_process');
var gulp = require('gulp');
var async = require('async');
var jetpack = require('fs-jetpack');
var nwjs = require('nwjs-downloader');
var zip = require('gulp-zip');
var winresourcer = require('winresourcer');
var crypto = require('crypto');

module.exports = function (paths) {
	return function releaseTask(complete) {
		var readyAppDir, manifest, nwjspath, appExe;
		async.waterfall([
			function (next) {
				console.log('Reading manifest');
				paths.destDir.readAsync('package.json', 'json').then(d => next(null, d)).catch(e => next(e));
			},
			function (m, next) {
				console.log('Incrementing version');
				manifest = m;
				var version = manifest.version.split('.').map(n => parseInt(n));
				version[2]++;
				if (version[2] == 10) {
					version[2] = 0;
					version[1]++;
				}
				if (version[1] == 10) {
					version[1] = 0;
					version[0]++;
				}
				version = version.join('.');
				manifest.version = version;
				async.parallel([
					function (next) {
						paths.destDir.writeAsync('package.json', manifest).then(() => next()).catch(e => next(e));
					},
					function (next) {
						paths.srcDir.readAsync('package.json', 'json').then(function (manifest) {
							manifest.version = version;
							return paths.srcDir.writeAsync('package.json', manifest);
						}).then(() => next()).catch(e => next(e));
					},
				], e => next(e));
			},
			function (next) {
				console.log('Getting nwjs');
				readyAppDir = paths.releasesDir.cwd(manifest.name + '-' + manifest.version);
				appExe = readyAppDir.path(manifest.name + '.exe');
				nwjs({
					version: manifest.nwjs.version,
					arch: manifest.nwjs.arch,
					sdk: manifest.nwjs.sdk,
				}, (e, d) => next(e, d));
			},
			function (exe, next) {
				console.log('Cleaning up old release');
				nwjspath = fp.dirname(exe);
				readyAppDir.dirAsync('.', {empty: true}).then(() => next()).catch(e => next(e));
			},
			function (next) {
				console.log('Copying nwjs files');
				jetpack.copyAsync(nwjspath, readyAppDir.path(), {overwrite: true}).then(() => next()).catch(e => next(e));
			},
			function (next) {
				console.log('Creating nwjs package');
				gulp.src(paths.destDir.path('**/*')).pipe(zip('package.nw')).pipe(gulp.dest(readyAppDir.path())).on('end', function () {
					next();
				});
			},
			function (next) {
				console.log('Setting exe icon');
			    winresourcer({
			        operation: "Update", // one of Add, Update, Extract or Delete 
			        exeFile: readyAppDir.path('nw.exe'),
			        resourceType: "Icongroup",
			        resourceName: "IDR_MAINFRAME",
			        lang: 1033, // Required, except when updating or deleting
			        resourceFile: paths.projectDir.path('resources/icon.ico') // Required, except when deleting 
			    }, next);
			},
			function (next) {
				console.log('Combining exe and package');
				var cmd = 'copy /b ';
				cmd += readyAppDir.path('nw.exe');
				cmd += '+';
				cmd += readyAppDir.path('package.nw');
				cmd += ' ';
				cmd += appExe;
				childProcess.exec(cmd, {cwd: readyAppDir.path()}, function (err, stdout, stderr) {
					next(err);
				});
			},
			function (next) {
				console.log('Cleaning up');
				async.parallel([
					n => readyAppDir.removeAsync('nw.exe').then(() => n()).catch(e => n(e)),
					n => readyAppDir.removeAsync('package.nw').then(() => n()).catch(e => n(e)),
					n => readyAppDir.removeAsync('data').then(() => n()).catch(e => n(e)),
					n => readyAppDir.removeAsync('cache').then(() => n()).catch(e => n(e)),
				], e => next(e));
			},
			function (next) {
				console.log('Compiling updater');
				var updaterPath = paths.projectDir.cwd('./updater');
				async.waterfall([
					function (next) {
						childProcess.exec(
							'msbuild "' + updaterPath.path('Updater.sln') + '" /property:Configuration=release /target:Rebuild /verbosity:normal /nologo',
							(err) => next(err)
						);
					},
					function (next) {
						try {
							updaterPath.copy('./Updater/bin/Release/Updater.exe', readyAppDir.path('updater.exe'));
						} catch (e) {
							return next(e);
						}
						next();
					},
				], next);
			},
			function (next) {
				async.parallel([
					function (next) {
						console.log('Zipping release');
						gulp.src(readyAppDir.path('**/*'))
							.pipe(zip(manifest.name + '-' + manifest.version + '_update.zip'))
							.pipe(gulp.dest(paths.releasesDir.path()))
							.on('end', () => next())
							.on('error', e => next(e));
					},
					function (next) {
						console.log('Creating installer');
						var innoFile = [];
					    innoFile.push('#define MyAppVersion "' + manifest.version + '"');
					    innoFile.push('#define MyAppExeName "' + manifest.name + '.exe"');
					    innoFile.push('#define OutputDir "' + paths.releasesDir.path() + '"');
					    innoFile.push('#define SetupName "' + (manifest.name + '-' + manifest.version) + '_installer"');
					    innoFile.push('#define SourcePath "' + readyAppDir.path() + '"');
					    innoFile.push('#define MyAppURL "https://github.com/maca134/ed-profit-scanner"');
					    innoFile.push('#define MyAppName "' + manifest.name + '"');
					    innoFile.push('#define MyAppProductName "' + manifest.productName + '"');
					    innoFile.push('#define MyAppPublisher "maca134"');

					    innoFile.push('[Setup]');
					    innoFile.push('AppId={{' + crypto.createHash('md5').update(manifest.name).digest('hex') + '}');
					    innoFile.push('AppName={#MyAppProductName}');
					    innoFile.push('AppVersion={#MyAppVersion}');
					    innoFile.push('AppPublisher={#MyAppPublisher}');
					    innoFile.push('AppPublisherURL={#MyAppURL}');
					    innoFile.push('AppSupportURL={#MyAppURL}');
					    innoFile.push('AppUpdatesURL={#MyAppURL}');
					    innoFile.push('DefaultDirName={userpf}\\{#MyAppName}');
					    innoFile.push('DefaultGroupName={#MyAppProductName}');
					    innoFile.push('OutputDir={#OutputDir}');
					    innoFile.push('OutputBaseFilename={#SetupName}');
					    innoFile.push('Compression=lzma');
					    innoFile.push('SolidCompression=yes');

					    innoFile.push('[Languages]');
					    innoFile.push('Name: "english"; MessagesFile: "compiler:Default.isl"');

					    innoFile.push('[Tasks]');
					    innoFile.push('Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"');

					    innoFile.push('[Files]');
					    innoFile.push('Source: "{#SourcePath}\\' + manifest.name + '.exe"; DestDir: "{app}"; Flags: ignoreversion');
					    innoFile.push('Source: "{#SourcePath}\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs');

					    innoFile.push('[Icons]');
					    innoFile.push('Name: "{group}\\{#MyAppProductName}"; Filename: "{app}\\{#MyAppExeName}"');
					    innoFile.push('Name: "{commondesktop}\\{#MyAppProductName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon');
						async.waterfall([
							function (next) {
								paths.tmpDir.writeAsync('create_installer.iss', innoFile.join('\n')).then(() => next()).catch(e => next(e));
							},
							function (next) {
								childProcess.exec('"C:\\Program Files (x86)\\Inno Setup 5\\iscc.exe" "' + paths.tmpDir.path('create_installer.iss') + '"', function (err, stdout, stderr) {
									next(err);
								});
							}
						], next);
					}
				], e => next(e));
			},
		], complete);
	};
};