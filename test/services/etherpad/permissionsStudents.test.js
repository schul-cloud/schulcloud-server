const chai = require('chai');
const chaiHttp = require('chai-http');
const freeport = require('freeport');
const { Configuration } = require('@schul-cloud/commons');
const decode = require('jwt-decode');
const logger = require('../../../src/logger');
const MockServer = require('./MockServer');
const testObjects = require('../helpers/testObjects');

const { expect } = chai;

chai.use(chaiHttp);

function request({
	server,
	method = 'get',
	endpoint,
	data,
	accessToken,
}) {
	return new Promise((resolve, reject) => (
		chai.request(server)[method](endpoint)
			.set({
				Accept: 'application/json',
				Authorization: accessToken,
				'Content-Type': 'application/x-www-form-urlencoded',
			})
			.send(data)
			.end((err, res) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(res);
			})
	));
}

describe('Etherpad services', () => {
	let mockServer;
	let server;
	let app;
	let testHelpers;
	let configBefore;

	before((done) => {
		configBefore = Configuration.toObject();
		freeport((err, port) => {
			if (err) {
				logger.warning('freeport:', err);
			}

			const ethPath = Configuration.get('ETHERPAD_API_PATH');
			const mockUrl = `http://localhost:${port}${ethPath}`;
			Configuration.set('ETHERPAD_URI', mockUrl);
			Configuration.set('ETHERPAD_API_KEY', 'someapikey');

			// eslint-disable-next-line global-require
			app = require('../../../src/app');
			server = app.listen(0);
			testHelpers = testObjects(app);

			const mock = MockServer(mockUrl, Configuration.get('ETHERPAD_API_PATH'), done);
			mockServer = mock.server;
		});
	});

	after(async () => {
		await mockServer.close();
		await server.close();
		Configuration.reset(configBefore);
	});

	const globalStorage = {};

	it('setup for student cross access check', async () => {
		const student = await testHelpers.setupUser({ roles: ['student'] });
		const jwt = decode(student.requestParams.authentication.accessToken);
		const course = await testHelpers.createTestCourse({
			userIds: [jwt.userId],
		});

		globalStorage.couseId = course.id;
	});

	it('student should have no access to foreign pad', async () => {
		const {
			requestParams: { authentication: { accessToken } },
		} = await testHelpers.setupUser({ roles: ['student'] });

		const data = {
			courseId: globalStorage.couseId,
			padName: 'testStudent',
			text: 'Grande Mucho Access Student',
		};

		const { body } = await request({
			server: app,
			method: 'post',
			endpoint: '/etherpad/pads',
			data,
			accessToken,
		});

		expect(body.code).to.equal(403);
	});
});
