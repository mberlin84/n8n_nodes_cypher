const { src, dest, series } = require('gulp');

function buildIcons() {
	return src('nodes/**/*.{svg,png}').pipe(dest('dist/nodes'));
}

function copyDriver() {
	// ensure vendor neo4j-driver files are available in dist
	return src('nodes/Cypher/neo4j-driver/**').pipe(dest('dist/nodes/Cypher/neo4j-driver'));
}

function copyDriverCore() {
	// also copy neo4j-driver-core package
	return src('nodes/Cypher/neo4j-driver-core/**').pipe(dest('dist/nodes/Cypher/neo4j-driver-core'));
}

exports['build:icons'] = series(buildIcons, copyDriver, copyDriverCore);

exports['build:icons'] = series(buildIcons, copyDriver);
