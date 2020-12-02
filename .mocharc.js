module.exports = {
	// This file applies defaults for mocha https://mochajs.org/#configuring-mocha-nodejs
	// List of available options https://mochajs.org/#command-line-usage
	diff: true,
	extension: ['js', 'ts'],
	recursive: true,
	package: './package.json',
	slow: 75,
	timeout: 2000,
	'watch-files': ['test/*', 'src/*', 'config/*'],
	spec: ['test/**/*.test.js', 'test/**/*.test.ts', 'src/**/*.test.js', 'src/**/*.test.ts'], // ts files needs to be added too

};
