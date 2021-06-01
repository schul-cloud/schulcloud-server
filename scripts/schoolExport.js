/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const lodash = require('lodash');
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
const {
	userModel: rocketChatUserModel,
	channelModel: rocketChatChannelModel,
} = require('../src/services/rocketChat/model');
const { homeworkModel, submissionModel } = require('../src/services/homework/model');
const { newsModel } = require('../src/services/news/model');

const exportSchool = async (schoolId) => schoolModel.findById(schoolId).exec();

const exportCourses = async (schoolId) => courseModel.find({ schoolId }).exec();

const exportUsers = async (schoolId) => userModel.find({ schoolId }).exec();

const exportAccounts = async (userId) => accountModel.findOne({ userId }).exec();

const exportTeams = async (schoolId) => teamsModel.find({ schoolId }).exec();

const exportTeamFiles = async (teamId) => FileModel.find({ owner: teamId, refOwnerModel: 'teams' }).exec();

const exportCourseFiles = async (courseId) => FileModel.find({ owner: courseId, refOwnerModel: 'course' }).exec();

const exportUserFiles = async (userId) => FileModel.find({ owner: userId, refOwnerModel: 'user' }).exec();

const exportCourseGroups = async (courseId) => courseGroupModel.find({ courseId }).exec();

const exportLtiTools = async (ltiToolIds) => ltiToolModel.find({ _id: { $in: ltiToolIds } }).exec();

const exportLessons = async (courseId) => LessonModel.find({ courseId }).exec();

const exportPasswordRecoveries = async (accountId) => passwordRecoveryModel.find({ account: accountId }).exec();

const exportRocketChatUsers = async (userId) => rocketChatUserModel.findOne({ userId }).exec();

const exportRocketChatChannels = async (teamId) => rocketChatChannelModel.findOne({ teamId }).exec();

const exportClasses = async (schoolId) => classModel.find({ schoolId }).exec();

const exportHomework = async (schoolId) => homeworkModel.find({ schoolId }).exec();

const exportSubmissions = async (schoolId) => submissionModel.find({ schoolId }).exec();

const exportNews = async (schoolId) => newsModel.find({ schoolId }).exec();

appPromise
	.then(async () => {
		const targetFile = process.argv[2];

		const fullJson = {
			school: {},
			courses: [],
			users: [],
			accounts: [],
			teams: [],
			files: [],
			courseGroups: [],
			ltiTools: [],
			lessons: [],
			passwordRecoveries: [],
			rocketChatUsers: [],
			rocketChatChannels: [],
			classes: [],
			homework: [],
			news: [],
			submissions: [],
		};

		const schoolId = '5c06890bf5e1230013857639';
		const users = await exportUsers(schoolId);
		const userFiles = (await Promise.all(users.map((u) => exportUserFiles(u._id)))).filter(
			(el) => el !== null && el !== ''
		);
		const accounts = (await Promise.all(users.map((u) => exportAccounts(u._id)))).filter((el) => el !== null);
		const teams = await exportTeams(schoolId);
		const teamFiles = (await Promise.all(teams.map((t) => exportTeamFiles(t._id)))).filter(
			(el) => el !== null && el !== ''
		);
		const courses = await exportCourses(schoolId);
		const courseFiles = (await Promise.all(courses.map((c) => exportCourseFiles(c._id)))).filter(
			(el) => el !== null && el !== ''
		);
		const courseGroups = (await Promise.all(courses.map((c) => exportCourseGroups(c._id)))).filter(
			(el) => el !== null && el !== ''
		);
		const ltiTools = (await Promise.all(courses.map((c) => exportLtiTools(c.ltiToolIds)))).filter(
			(el) => el !== null && el !== ''
		);
		const lessons = (await Promise.all(courses.map((c) => exportLessons(c._id)))).filter(
			(el) => el !== null && el !== ''
		);
		const passwordRecoveries = (await Promise.all(accounts.map((a) => exportPasswordRecoveries(a._id)))).filter(
			(el) => el !== null && el !== ''
		);
		const rocketChatUsers = (await Promise.all(users.map((u) => exportRocketChatUsers(u._id)))).filter(
			(el) => el !== null
		);
		const rocketChatChannels = (await Promise.all(teams.map((t) => exportRocketChatChannels(t._id)))).filter(
			(el) => el !== null
		);
		const classes = await exportClasses(schoolId);
		const homework = await exportHomework(schoolId);
		const news = await exportNews(schoolId);
		const submissions = await exportSubmissions(schoolId);

		fullJson.school = (await exportSchool(schoolId)).toJSON();
		fullJson.courses = lodash.uniqBy(courses, (e) => e._id.toString()).map((c) => c.toJSON());
		fullJson.teams = lodash.uniqBy(teams, (e) => e._id.toString()).map((c) => c.toJSON());
		fullJson.users = lodash.uniqBy(users, (e) => e._id.toString()).map((c) => c.toJSON());
		fullJson.accounts = lodash.uniqBy(accounts, (e) => e._id.toString()).map((a) => a.toJSON());
		teamFiles.flat().map((f) => fullJson.files.push(f));
		courseFiles.flat().map((f) => fullJson.files.push(f));
		userFiles.flat().map((f) => fullJson.files.push(f));
		fullJson.files = lodash.uniqBy(fullJson.files, (e) => e._id.toString());
		fullJson.courseGroups = lodash.uniqBy(courseGroups.flat(), (e) => e._id.toString());
		fullJson.ltiTools = lodash.uniqBy(ltiTools.flat(), (e) => e._id.toString());
		fullJson.lessons = lodash.uniqBy(lessons.flat(), (e) => e._id.toString());
		fullJson.passwordRecoveries = lodash.uniqBy(passwordRecoveries.flat(), (e) => e._id.toString());
		fullJson.rocketChatUsers = lodash.uniqBy(rocketChatUsers, (e) => e._id.toString()).map((u) => u.toJSON());
		fullJson.rocketChatChannels = lodash.uniqBy(rocketChatChannels, (e) => e._id.toString()).map((c) => c.toJSON());
		fullJson.classes = lodash.uniqBy(classes, (e) => e._id.toString()).map((c) => c.toJSON());
		fullJson.homework = lodash.uniqBy(homework, (e) => e._id.toString()).map((h) => h.toJSON());
		fullJson.news = lodash.uniqBy(news, (e) => e._id.toString()).map((n) => n.toJSON());
		fullJson.submissions = lodash.uniqBy(submissions, (e) => e._id.toString()).map((s) => s.toJSON());

		const fullJsonString = JSON.stringify(fullJson);

		await fs.writeFile(targetFile, fullJsonString);

		return process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		return process.exit(1);
	});
