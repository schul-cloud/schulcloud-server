/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const fs = require('fs').promises

const appPromise = require('../src/app');
const mongoose = require('mongoose');

const {schoolModel} = require('../src/services/school/model')
const {userModel} = require('../src/services/user/model')
const accountModel = require('../src/services/account/model')
const {courseModel} = require('../src/services/user-group/model')

appPromise
    .then(async (app) => {
        // let fullJson = {
        // 	school: {},
        // 	courses: [],
        // 	users: [],
        // 	accounts: [],
        // }


        const importFile = await fs.readFile(process.argv[2], {encoding: 'utf-8'});
        const fullJson = JSON.parse(importFile);

        await schoolModel.create(fullJson.school)

        for (const course of fullJson.courses) {
            await courseModel.create(course)
        }
        for (const user of fullJson.users) {
            await userModel.create(user)
        }

        for (const acc of fullJson.accounts) {
            await accountModel.create(acc)
        }

        console.log('done');

        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        return process.exit(1);
    });
