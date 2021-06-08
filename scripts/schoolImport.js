/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const fs = require('fs').promises;
// const mongoose = require('mongoose');
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
const {
	userModel: rocketChatUserModel,
	channelModel: rocketChatChannelModel,
} = require('../src/services/rocketChat/model');
const { homeworkModel, submissionModel } = require('../src/services/homework/model');
const { newsModel } = require('../src/services/news/model');

appPromise
	.then(async () => {
		// variable importFile needs to be created beorehand with schoolExport.js
		const importFile = await fs.readFile(process.argv[2], { encoding: 'utf-8' });
		const fullJson = JSON.parse(importFile);

		await schoolModel.create(fullJson.school);

		for (const course of fullJson.courses) {
			await courseModel.create(course);
		}

		for (const user of fullJson.users) {
			await userModel.create(user);
		}

		for (const acc of fullJson.accounts) {
			await accountModel.create(acc);
		}

		for (const team of fullJson.teams) {
			await teamsModel.create(team);
		}

		for (const file of fullJson.files) {
			await FileModel.create(file);
		}

		for (const group of fullJson.courseGroups) {
			await courseGroupModel.create(group);
		}

		for (const tool of fullJson.ltiTools) {
			await ltiToolModel.create(tool);
		}

		for (const lesson of fullJson.lessons) {
			await LessonModel.create(lesson);
		}

		for (const recovery of fullJson.passwordRecoveries) {
			await passwordRecoveryModel.create(recovery);
		}

		for (const chatUser of fullJson.rocketChatUsers) {
			await rocketChatUserModel.create(chatUser);
		}

		for (const chatChannel of fullJson.rocketChatChannels) {
			await rocketChatChannelModel.create(chatChannel);
		}

		for (const oneClass of fullJson.classes) {
			await classModel.create(oneClass);
		}

		for (const homework of fullJson.homework) {
			await homeworkModel.create(homework);
		}

		for (const news of fullJson.news) {
			await newsModel.create(news);
		}

		for (const sub of fullJson.submissions) {
			await submissionModel.create(sub);
		}

		console.log('done');

		return process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		return process.exit(1);
	});
