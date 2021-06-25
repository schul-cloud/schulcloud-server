const mongoose = require('mongoose');

const { Schema } = mongoose;
// eslint-disable-next-line no-unused-vars
const { info } = require('../src/logger');

const { connect, close } = require('../src/utils/database');

const { schoolSchema } = require('../src/services/school/model');

const School = mongoose.model('school_20210628', schoolSchema, 'schools');

const federalStateSchema = new Schema({
	name: { type: String, required: true },
});

const federalStateModel = mongoose.model('federalState_20210628', federalStateSchema, 'federalstates');

const yearSchema = new Schema({
	name: {
		type: String,
		required: true,
		match: /^[0-9]{4}\/[0-9]{2}$/,
		unique: true,
	},
	startDate: { type: Date, required: true },
	endDate: { type: Date, required: true },
});
const YearModel = mongoose.model('yearModel_20210628', yearSchema, 'years');

const DATE_CLUSTER = new Date('2021-06-28');

const federalStateNames = ['Brandenburg'];

module.exports = {
	up: async function up() {
		if (process.env.SC_THEME !== 'brb') {
			info('This migration will apply changes only if SC_THEME=brb');
			Promise.resolve('this migration will apply changes only if SC_THEME=brb');
			return;
		}

		await connect();

		const nextSchoolYearId = await YearModel.findOne({ name: '2021/22' }).select('_id').lean().exec();

		const federalStates = await federalStateModel
			.find({ name: { $in: federalStateNames } })
			.select('_id name')
			.lean()
			.exec();
		const federalStateIds = federalStates.map((state) => state._id);
		info(`Migrating schools in ${federalStateIds.length} federalstates (${federalStateNames.toString()})`);

		info('Setting up Maintenance mode for LDAP schools');
		const resultLdapSchools = await School.updateMany(
			{
				federalState: { $in: federalStateIds },
				ldapSchoolIdentifier: { $exists: true },
			},
			{ inMaintenanceSince: DATE_CLUSTER }
		).exec();
		info(`LDAP Schools set in Maintenance mode: ${resultLdapSchools.nModified} schools updated`);

		const resultNonLdapSchools = await School.updateMany(
			{
				federalState: { $in: federalStateIds },
				ldapSchoolIdentifier: { $exists: false },
			},
			{ currentYear: nextSchoolYearId._id }
		).exec();
		info(`Non-LDAP Schools changed year: ${resultNonLdapSchools.nModified} schools updated`);

		await close();
	},

	down: async function down() {
		if (process.env.SC_THEME !== 'brb') {
			info('This migration will apply changes only if SC_THEME=brb');
			Promise.resolve('This migration will apply changes only if SC_THEME=brb');
			return;
		}

		await connect();

		const federalStates = await federalStateModel
			.find({ name: { $in: federalStateNames } })
			.select('_id')
			.lean()
			.exec();
		const federalStateIds = federalStates.map((state) => state._id);

		info('Disabling Maintenance mode for related LDAP schools');
		const schools = await School.updateMany(
			{
				federalState: { $in: federalStateIds },
				ldapSchoolIdentifier: { $exists: true },
				inMaintenanceSince: { $exists: true },
			},
			{ $unset: { inMaintenanceSince: '' } }
		).exec();
		info(`Updated ${schools.nModified} LDAP schools`);

		info('Reverting the current school year change for related non-LDAP schools');
		const currentSchoolYearId = await YearModel.findOne({ name: '2020/21' }).select('_id').lean().exec();
		const nonLdapSchools = await School.updateMany(
			{
				federalState: { $in: federalStateIds },
				ldapSchoolIdentifier: { $exists: false },
			},
			{ currentYear: currentSchoolYearId._id }
		).exec();
		info(`Updated ${nonLdapSchools.nModified} Non-LDAP schools`);

		await close();
	},
};
