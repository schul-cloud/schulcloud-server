const database = require('../../utils/database');

const {
	requestFullSchoolSync,
	requestCourseSync,
	requestTeamSync,
	requestFullSyncForUser,
	requestTeamRemoval,
	requestCourseRemoval,
	requestUserRemoval,
} = require('./producer');

const { teamsModel } = require('../teams/model');
const { courseModel } = require('../user-group/model');
const { userModel } = require('../user/model');
const { schoolModel } = require('../school/model');

const requestSyncCall = {
	teams: requestTeamSync,
	courses: requestCourseSync,
	users: requestFullSyncForUser,
	schools: requestFullSchoolSync,
};

const requestRemovalCall = {
	teams: requestTeamRemoval,
	courses: requestCourseRemoval,
	users: requestUserRemoval,
	schools: () => {},
};

const messengerRelevantAttributes = {
	teams: ['name', 'userIds', 'classIds'],
	courses: ['name', 'teacherIds', 'userIds', 'classIds'],
	users: ['firstName', 'lastName', 'roles'],
	schools: ['name', 'features'],
};

const createSyncRequestTrigger = (collection) => async (change) => {
	if (change.operationType === 'update') {
		const changedAttributes = Object.keys(change.updateDescription.updatedFields);
		if (changedAttributes.some((attribute) => messengerRelevantAttributes[collection].includes(attribute))) {
			requestSyncCall[collection](change.documentKey._id);
		}
	} else if (change.operationType === 'insert' || change.operationType === 'replace') {
		requestSyncCall[collection](change.documentKey._id);
	} else if (change.operationType === 'delete') {
		requestRemovalCall[collection](change.documentKey._id);
	}
};

const setup = async () => {
	await database.connect();

	teamsModel.watch().on('change', createSyncRequestTrigger('teams'));
	courseModel.watch().on('change', createSyncRequestTrigger('courses'));
	userModel.watch().on('change', createSyncRequestTrigger('users'));
	schoolModel.watch().on('change', createSyncRequestTrigger('schools'));
};

module.exports = setup;
