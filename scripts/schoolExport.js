/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const fs = require('fs').promises

const appPromise = require('../src/app');

const {schoolModel} = require('../src/services/school/model')
const {userModel} = require('../src/services/user/model')
const {teamsModel} = require('../src/services/teams/model')
const accountModel = require('../src/services/account/model')
const {courseModel} = require('../src/services/user-group/model')

const exportSchool = async (schoolId) => {
    return schoolModel.findById(schoolId).exec()
}
const exportCourses = async (schoolId) => {
    return courseModel.find({'schoolId': schoolId}).exec()
}

const exportUsers = async (schoolId) => {
    return userModel.find({'schoolId': schoolId}).exec()
}

const exportAccounts = async (userId) => {
    return accountModel.findOne({'userId': userId}).exec()
}

const exportTeams = async (schoolId) => {
    return teamsModel.find({'schoolId': schoolId}).exec()
}

appPromise
    .then(async (app) => {
        let fullJson = {
            school: {},
            courses: [],
            users: [],
            accounts: [],
            teams: []
        }


        const schoolId = '5f2987e020834114b8efd6f6';
        const users = await exportUsers(schoolId);
        const accounts = await Promise.all(users.map(u => exportAccounts(u._id)))


        fullJson.school = (await exportSchool(schoolId)).toJSON();
        fullJson.courses = (await exportCourses(schoolId)).map(c => c.toJSON())
        fullJson.teams = (await exportTeams(schoolId)).map(c => c.toJSON())
        fullJson.users = users.map(c => c.toJSON())
        fullJson.accounts = accounts.map(a => a.toJSON())

        let fullJsonString = JSON.stringify(fullJson);

        const uuidRegex = new RegExp('([a-f0-9]{24})', 'g')

        fullJsonString = fullJsonString.replace(uuidRegex, function (a, uuidMatch) {
            const uuidBigInt = BigInt('0x' + uuidMatch)
            return (uuidBigInt + 43n).toString(16)
        })

        await fs.writeFile(process.argv[2], fullJsonString, err => {
            if (err) {
                console.error(err)
                return process.exit(1);
            }
        })

        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        return process.exit(1);
    });
