const AbstractLDAPStrategy = require('./interface.js');
const { filterForModifiedEntities } = require('./deltaSyncUtils');

/**
 * iServ-IDM-specific LDAP functionality
 * @implements {AbstractLDAPStrategy}
 */
class IservIdmLDAPStrategy extends AbstractLDAPStrategy {
	/**
	 * @see AbstractLDAPStrategy#getSchools
	 * @returns {Array} Array of Objects containing ldapOu (ldap Organization Path), displayName
	 */
	async getSchools() {
		const options = {
			filter: 'objectClass=mebisSchool',
			scope: 'sub',
			attributes: ['ou', 'o', 'dc', 'dn'],
		};
		const schools = await this.app.service('ldap').searchCollection(this.config, this.config.rootPath, options);
		return schools.map((school) => ({
			ldapOu: school.dn,
			displayName: school.ou,
		}));
	}

	/**
	 * @see AbstractLDAPStrategy#getUsers
	 * @returns {Array} Array of Objects containing email, firstName, lastName, ldapDn, ldapUUID, ldapUID,
	 * (Array) roles = ['teacher', 'student', 'administrator']
	 */
	async getUsers(school) {
		const requiredAttributes = '(objectClass=mebisUser)(sn=*)(uid=*)(givenName=*)';
		const options = {
			filter: filterForModifiedEntities(this.config.lastModifyTimestamp, `(&${requiredAttributes})`),
			scope: 'sub',
			attributes: ['givenName', 'sn', 'dn', 'cn', 'objectClass', 'uid', 'modifyTimestamp', 'mebisUserType'],
		};
		const data = await this.app.service('ldap').searchCollection(this.config, school.ldapSchoolIdentifier, options);

		const results = [];
		data.forEach((user) => {
			const roles = [];

			if (user.mebisUserType === 'lehrer') {
				roles.push('teacher');
			}
			if (user.mebisUserType === 'schueler') {
				roles.push('student');
			}

			// TODO define how to handle mail addresses
			// dummy mail address? what pattern? additional flag?
			results.push({
				email: `bavaria-user-${user.uid}@hpi-schul-cloud.org`,
				firstName: user.givenName,
				lastName: user.sn,
				roles,
				ldapDn: user.dn,
				ldapUUID: user.uid,
				ldapUID: user.cn,
				modifyTimestamp: user.modifyTimestamp,
			});
		});
		return results;
	}

	/**
	 * @see AbstractLDAPStrategy#getClasses
	 * @returns {Array} Array of Objects containing className, ldapDn, uniqueMembers
	 */
	async getClasses(school) {
		const options = {
			filter: filterForModifiedEntities(this.config.lastModifyTimestamp, '(objectClass=mebisKlasse)'),
			scope: 'sub',
			attributes: ['cn', 'dn', 'description', 'member', 'modifyTimestamp'],
		};
		const data = await this.app.service('ldap').searchCollection(this.config, school.ldapSchoolIdentifier, options);

		return data.map((ldapClass) => ({
			className: ldapClass.cn,
			ldapDn: ldapClass.dn,
			uniqueMembers: ldapClass.member,
			modifyTimestamp: ldapClass.modifyTimestamp,
		}));
	}
}

module.exports = IservIdmLDAPStrategy;
