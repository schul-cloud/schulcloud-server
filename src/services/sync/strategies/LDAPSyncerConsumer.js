const _ = require('lodash');
const { getChannel } = require('../../../utils/rabbitmq');
const logger = require('../../../logger');
const { createUserAndAccount, updateUserAndAccount, findByLdapIdAndSchool } = require('../repo/user.repo');
const { createClass, updateClassName, findClassByYearAndLdapDn } = require('../repo/class.repo');
const { createSchool, updateSchoolName, findSchoolByLdapIdAndSystem } = require('../repo/school.repo');

const { BadRequest } = require('../../../errors');

const { LDAP_SYNC_ACTIONS, LDAP_SYNC_CHANNEL_NAME } = require('./LDAPSyncer');

class LDAPSyncerConsumer {
	async executeMessage(incomingMessage) {
		const content = JSON.parse(incomingMessage.content.toString());
		logger.debug(`Incoming ${content.action} ${content.syncId}: ${JSON.stringify(content.data).substring(0, 100)}...`);
		switch (content.action) {
			case LDAP_SYNC_ACTIONS.SYNC_SCHOOL: {
				return this.schoolAction(content.data);
			}

			case LDAP_SYNC_ACTIONS.SYNC_USER: {
				return this.userAction(content.data);
			}

			case LDAP_SYNC_ACTIONS.SYNC_CLASSES: {
				return this.classAction(content.data);
			}

			default: {
				// message can't be processed
				throw new BadRequest(`${content.action} is not valid message action`);
			}
		}
	}

	async schoolAction(schoolData) {
		const school = await findSchoolByLdapIdAndSystem(schoolData.ldapSchoolIdentifier, schoolData.systems);

		try {
			if (school !== undefined) {
				const schoolId = school._id;
				await updateSchoolName(schoolId, schoolData.name);
			} else {
				await createSchool(schoolData);
			}
			return true;
		} catch (err) {
			logger.error('LDAP SYNC: error while update or add a school', { err, syncId: schoolData.syncId });
			throw err;
		}
	}

	async userAction(data) {
		const school = await findSchoolByLdapIdAndSystem(data.user.schoolDn, data.user.systemId);
		if (school !== undefined) {
			const userData = await findByLdapIdAndSchool(data.user.ldapId, school._id);
			try {
				if (userData.total !== 0) {
					return this.updateUser(data.user, userData.data[0], data.account);
				}
				return this.createUser(data.user, data.account, school._id);
			} catch (err) {
				logger.error('LDAP SYNC: error while update or add a user', { err, syncId: data.syncId });
				throw err;
			}
		}
		return true;
	}

	async updateUser(user, userData, account) {
		const updateObject = {};
		if (userData.firstName !== user.firstName) {
			updateObject.firstName = user.firstName || ' ';
		}
		if (userData.lastName !== user.lastName) {
			updateObject.lastName = user.lastName;
		}
		// Updating SchoolId will cause an issue. We need to discuss about it
		if (userData.email !== user.email) {
			updateObject.email = user.email;
		}
		if (userData.ldapDn !== user.ldapDn) {
			updateObject.ldapDn = user.ldapDn;
		}
		// Role
		const userDataRoles = userData.roles.map((r) => r.name);
		if (!_.isEqual(userDataRoles, user.roles)) {
			updateObject.roles = user.roles;
		}
		if (!_.isEmpty(updateObject)) {
			return updateUserAndAccount(userData._id, updateObject, account);
		}
		return true;
	}

	async createUser(idmUser, account, schoolId) {
		try {
			idmUser.schoolId = schoolId;
			return createUserAndAccount(idmUser, account);
		} catch (err) {
			logger.error('LDAP SYNC: error while creating User', err);
			throw err;
		}
	}

	async classAction(classData) {
		const school = await findSchoolByLdapIdAndSystem(classData.schoolDn, classData.systemId);

		if (school !== undefined) {
			const existingClasses = await findClassByYearAndLdapDn(school.currentYear, classData.ldapDn);

			if (existingClasses.total === 0) {
				const newClass = {
					name: classData.className,
					schoolId: school._id,
					nameFormat: 'static',
					ldapDN: classData.ldapDn,
					year: school.currentYear,
				};
				return createClass(newClass);
			}
			const existingClass = existingClasses.data[0];
			if (existingClass.name !== classData.className) {
				return updateClassName(existingClass._id, classData.className);
			}
		}
		return true;
	}
}

const setupConsumer = () => {
	const syncQueue = getChannel(LDAP_SYNC_CHANNEL_NAME, { durable: true });
	const consumer = new LDAPSyncerConsumer();

	const handleMessage = (incomingMessage) =>
		consumer
			.executeMessage(incomingMessage)
			.then(() => {
				return true;
			})
			.catch((err) => {
				logger.error('LDAP SYNC: error while handling Stuff', { err, syncId: incomingMessage.syncId });
				return false;
			})
			.finally(() => syncQueue.ackMessage(incomingMessage));

	return syncQueue.consumeQueue(handleMessage, { noAck: false });
};

module.exports = {
	consumer: setupConsumer,
	LDAPSyncerConsumer,
};
