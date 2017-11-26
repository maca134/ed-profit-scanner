module.exports = function (paths) {
	return function copyTask() {
		return paths.projectDir.copyAsync('app', paths.destDir.path(), {
			overwrite: true,
			matching: [
				'./img/**/*',
				'./node_modules/**',
				'./*.html',
				'./*.json',
				'./vendor/**',
				'./tpl/**',
				'./js/lib/**',
			]
		});
	};
};