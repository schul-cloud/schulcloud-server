import { PickType } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { WithTimeStampBaseEntity } from '../../../../models/repo/entity/base.entity';
import { SchoolEntity } from '../../../school/repo/school.entity';
import { UserEntity } from '../../../users/entities/user.entity';

class PickSchoolEntity extends PickType(SchoolEntity, ['id', 'name'] as const) {}
class PickUserEntity extends PickType(UserEntity, ['id', 'firstName', 'lastName'] as const) {}

export class NewsEntity extends WithTimeStampBaseEntity {
	/** the news title */
	title: string;
	/** the news content as html */
	content: string;
	/** only past news are visible for viewers, when edit permission, news visible in the future might be accessed too  */
	displayAt: Date;

	source: 'internal' | 'rss';

	// hidden api properties

	externalId?: string;
	sourceDescription?: string;

	// target and targetModel both must either exist or not
	/** id reference to a collection */
	target?: Types.ObjectId;
	/** name of a collection which is referenced in target */
	targetModel?: string;

	// populated properties

	schoolId: Types.ObjectId | PickSchoolEntity;

	/** user id of creator */
	creatorId: Types.ObjectId | PickUserEntity;

	/** when updated, the user id of the updating user */
	updaterId?: Types.ObjectId | PickUserEntity;

	constructor(partial: Partial<NewsEntity>) {
		super();
		Object.assign(this, partial);
	}
}

export type NewsDocument = Document & NewsEntity;
