import { BaseBusinessObject } from 'apps/server/src/models/bo/base.bo';

export class User extends BaseBusinessObject {
	id: string;
	firstName: string;
	lastName: string;
	get fullName() {
		return `${this.firstName} ${this.lastName}`.trim();
	}
}
