/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const fs = require('fs').promises;

const appPromise = require('../src/app');

const { schoolModel } = require('../src/services/school/model');
const { FileModel } = require('../src/services/fileStorage/model');
const { userModel } = require('../src/services/user/model');
const { teamsModel } = require('../src/services/teams/model');
const accountModel = require('../src/services/account/model');
const { courseModel, courseGroupModel, classModel } = require('../src/services/user-group/model');
const ltiToolModel = require('../src/services/ltiTool/model');
const { LessonModel } = require('../src/services/lesson/model');
const passwordRecoveryModel = require('../src/services/passwordRecovery/model');
const { userModel: rocketChatUserModel, channelModel: rocketChatChannelModel } = require('../src/services/rocketChat/model');
const { homeworkModel, submissionModel } = require('../src/services/homework/model');
const { newsModel } = require('../src/services/news/model');

const exportSchool = async (schoolId) => {
	return schoolModel.findById(schoolId).exec();
};
const exportCourses = async (schoolId) => {
	return courseModel.find({ schoolId: schoolId }).exec();
};

const exportUsers = async (schoolId) => {
	return userModel.find({ schoolId: schoolId }).exec();
};

const exportAccounts = async (userId) => {
	return accountModel.findOne({ userId: userId }).exec();
};

const exportTeams = async (schoolId) => {
	return teamsModel.find({ schoolId: schoolId }).exec();
};

const exportTeamFiles = async (teamId) => {
	return FileModel.find({ owner: teamId, refOwnerModel: 'teams' }).exec();
}

const exportCourseFiles = async (courseId) => {
	return FileModel.find({ owner: courseId, refOwnerModel: 'course' }).exec();
}

const exportUserFiles = async (userId) => {
	return FileModel.find({ owner: userId, refOwnerModel: 'user' }).exec();
}

const exportCourseGroups = async (courseId) => {
	return courseGroupModel.find({ courseId: courseId }).exec();
}

const exportLtiTools = async (ltiToolIds) => {
	return ltiToolModel.find({ _id: { $in: ltiToolIds }}).exec();
}

const exportLessons = async (courseId) => {
	return LessonModel.find({ courseId: courseId }).exec();
}

const exportPasswordRecoveries = async (accountId) => {
	return passwordRecoveryModel.find({ account: accountId }).exec();
}

const exportRocketChatUsers = async (userId) => {
	return rocketChatUserModel.find({ userId: userId }).exec();
}

const exportRocketChatChannels = async (teamId) => {
	return rocketChatChannelModel.find({ teamId: teamId }).exec();
}

const exportClasses = async (schoolId) => {
	return classModel.find({ schoolId: schoolId }).exec();
}

const exportHomework = async (schoolId) => {
	return homeworkModel.find({ schoolId: schoolId }).exec();
}

const exportSubmissions = async (schoolId) => {
	return submissionModel.find({ schoolId: schoolId }).exec();
}

const exportNews = async (schoolId) => {
	return newsModel.find({ schoolId: schoolId }).exec();
}

const baseOfId = 16;
const idDigitAmount = 24;
const maxIdValue = (BigInt(baseOfId) ** BigInt(idDigitAmount)) - 1n;
const idRegex = new RegExp('([a-f0-9]{24})', 'g');

const idMapping = {};

/**
 * This function is used to modify the given id
 * by interpretating it as hexadeciaml number,
 * adding a value to it
 * and converting it back to an hexadecimal string.
 * @param {*} id id that should be modified
 * @param {*} addend value that is added to the id value to create a modified id
 * @returns modified id
 */
const modifyId = (id, addend) => {
    if (idMapping[id]) {
        return idMapping[id];
    }
    const idBigInt = BigInt('0x' + id);
    const newId = (idBigInt + BigInt(addend) % maxIdValue).toString(16);
    idMapping[id] = newId;
    return newId;
}

appPromise
	.then(async (app) => {
        const targetFile = process.argv[2];

		let fullJson = {
			school: {},
			courses: [],
			users: [],
			accounts: [],
			teams: [],
		};

		const schoolId = '5f2987e020834114b8efd6f8';
		const users = await exportUsers(schoolId);
		const accounts = await Promise.all(users.map((u) => exportAccounts(u._id)));

		fullJson.school = (await exportSchool(schoolId)).toJSON();
		fullJson.courses = (await exportCourses(schoolId)).map((c) => c.toJSON());
		fullJson.teams = (await exportTeams(schoolId)).map((c) => c.toJSON());
		fullJson.users = users.map((c) => c.toJSON());
		fullJson.accounts = accounts.map((a) => a.toJSON());

		const fullJsonString = JSON.stringify(fullJson).replace(idRegex, (_, idMatch) => modifyId(idMatch, 43));

		await fs.writeFile(targetFile, fullJsonString);

		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		return process.exit(1);
	});
