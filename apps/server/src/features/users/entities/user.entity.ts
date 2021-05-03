import { PickType } from '@nestjs/swagger';
import { WithTimeStampBaseEntity } from '../../../models/repo';

export class UserEntity extends WithTimeStampBaseEntity {
	firstName: string;
	lastName: string;
	email: string;
	birthday: Date;
}

export class UserShortEntity extends PickType(UserEntity, ['_id', 'firstName', 'lastName'] as const) {}
