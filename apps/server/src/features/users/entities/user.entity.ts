import { WithTimeStampBaseEntity } from '../../../models/repo';

export class UserEntity extends WithTimeStampBaseEntity {
	firstName: string;
	lastName: string;
	email: string;
	birthday: Date;
}
