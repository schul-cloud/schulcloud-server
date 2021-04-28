const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { Forbidden, GeneralError } = require('../../errors');
const logger = require('../../logger');
const hooks = require('./hooks');
const { externallyManaged } = require('../helpers/utils');
const { Configuration } = require('@hpi-schul-cloud/commons');

class Service {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	/**
	 * request headers
	 * set Content-Type = application/json
	 * set Authorization = Bearer [jwt]
	 */
	async find(params) {
		const { userId } = params.account;
		const userServiceParams = {
			query: {
				$populate: ['roles'],
			},
		};
		let user = {};
		let school = {};

		try {
			user = await this.app.service('/users').get(userId, userServiceParams);
		} catch (err) {
			logger.warning(err);
			throw new Forbidden('Your access token is not valid.');
		}
		user.accountId = params.account._id;
		try {
			school = await this.app.service('/schools').get(user.schoolId);
			user.schoolName = school.name;
		} catch (err) {
			logger.warning(err);
			throw new GeneralError("Can't find connected school.");
		}
		try {
			user.externallyManaged = await externallyManaged(this.app, user);
		} catch (err) {
			logger.warning(err);
			throw new GeneralError("Can't check externallyManaged");
		}
		user.language = user.language || school.language;
		user.envVariables = {
			ADMIN_TABLES_DISPLAY_CONSENT_COLUMN: Configuration.get('ADMIN_TABLES_DISPLAY_CONSENT_COLUMN'),
			SOME_OTHER_ENV_VARIABLES: 'string_value',
			SOME_ANY_OTHER_ENV_VARIABLES: true,
		};
		return user;
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	app.use('/me/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('legacy/v1/me', new Service());

	const me = app.service('legacy/v1/me');
	me.hooks(hooks);
};
