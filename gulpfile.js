const { src, dest, series } = require('gulp');

function buildIcons() {
	return src('nodes/**/*.{svg,png}').pipe(dest('dist/nodes'));
}

function copyDriver() {
	return src('nodes/**/*.{svg,png}').pipe(dest('dist/nodes'));
}

exports['build:icons'] = copyDriver;

exports['build:icons'] = series(buildIcons, copyDriver);
