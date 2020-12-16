const schoolRepo = require('../repo/schoolRepo');
const { SCHOOL_OF_DELETE_USERS_NAME } = require('../repo/db');

const getSchool = async (id) => {
	return schoolRepo.getSchool(id);
};

const getTombstoneSchool = async () => {
	const tombstoneSchool = await schoolRepo.findSchools({ name: SCHOOL_OF_DELETE_USERS_NAME });
	return tombstoneSchool[0];
};

const updateSchool = async (schoolId, schoolPatch) => {
	return schoolRepo.updateSchool(schoolId, schoolPatch);
};

const checkPermissions = async (id, permissionToCheck, user) => {
	let grantPermission = true;
	// same school?
	grantPermission = grantPermission && user.schoolId === id;

	// user has permission
	grantPermission =
		grantPermission &&
		user.roles.some((role) => role.permissions.some((permission) => permission === permissionToCheck));

	return grantPermission;
};

module.exports = {
	getSchool,
	getTombstoneSchool,
	updateSchool,
	checkPermissions,
};