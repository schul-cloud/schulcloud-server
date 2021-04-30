import { PickType } from '@nestjs/mapped-types';
import { User } from '../../users/bo/user.bo';
import { BaseBusinessObject } from 'apps/server/src/models/bo/base.bo';
import { School } from '../../school/bo/school.bo';

class SchoolPick extends PickType(School, ['id', 'name'] as const) {}
class UserPick extends PickType(User, ['id', 'firstName', 'lastName', 'fullName'] as const) {}

export class News extends BaseBusinessObject {
	id: string;

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

	/** reference to a collection */
	target?: { id: string; name: string };
	/** name of a collection which is referenced in target */
	targetModel?: string;

	permissions: string[];

	// populated properties
	school?: SchoolPick;
	creator?: UserPick;
	updater?: UserPick;
}
