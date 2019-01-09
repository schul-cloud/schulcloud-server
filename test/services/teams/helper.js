const rolesModel = require('../../../src/services/role/model.js');
const { userModel } = require('../../../src/services/user/model.js');
const accountModel = require('../../../src/services/account/model.js');
//const app = require(SRC + 'app');
const { BadRequest } = require('feathers-errors');
const { ObjectId } = require('mongoose').Types;
const app = require('../../../src/app');
//const {warn, info} = require('../../../src/logger/index.js');

const PASSWORD = process.env.TEST_PW.trim(); 	
const PASSWORD_HASH = process.env.TEST_HASH.trim(); 

const REQUEST_PARAMS = {
    headers: {'content-type': 'application/json'},
    provider: 'rest',
};

const getToken = ({userId}) => {
    return app.service('authentication').create({
        strategy: 'local',
        username: userId + '@schul-cloud.org',
        password: PASSWORD,
    },REQUEST_PARAMS)
    .then(result=>result.accessToken)
    .catch(err=>{
       throw err;
    });
};

const getRoleByKey = (key,value) =>{
    return rolesModel.find({
        [key]: value
    })
    .then(([role])=>role);
};

const createUser = async (userId, roleName = 'student', schoolId = '0000d186816abba584714c5f') => {

    if (!['expert', 'student', 'teacher', 'parent', 'administrator', 'superhero'].includes(roleName)) 
        throw BadRequest('You want to test a not related role .' + roleName);  

    const role = await getRoleByKey('name',roleName);

    return userModel.create({
        _id: userId,
        email: userId + '@schul-cloud.org',
        schoolId,
        firstName: userId,
        lastName: 'GerneratedTestUser',
        roles: [
            role._id,
        ],
    });
};

const createAccount = async (userId) => {
    return accountModel.create({
        username: userId + '@schul-cloud.org',
        password: PASSWORD_HASH,
        userId,
        activated: true,
    });
};

const setupUser = async (roleName, schoolId) => {
    const userId = ObjectId();

    return Promise.all([createUser(userId, roleName, schoolId), createAccount(userId)]).then(async ([user, account]) => {
        const accessToken = await getToken(account);
        return { userId, account, user, accessToken };
    });
};

const deleteUser = async (userId) => {
    if(typeof userId === 'object' && userId.userId!==undefined)
        userId=userId.userId;
        
    const email = userId + '@schul-cloud.org';
    await userModel.deleteOne({ email });     //todo: add error handling if not exist
    await accountModel.deleteOne({ username: email });
};

class MockEmailService {
    constructor(eventHandler) {
        this.eventHandler = eventHandler;
    }

    create({ headers, email, subject, content }, params) {
        this.eventHandler({ subject, content });
        return Promise.resolve();
    }
}

module.exports = {
    setupUser,
    getToken,
    getRoleByKey,
    deleteUser,
    MockEmailService,
};
