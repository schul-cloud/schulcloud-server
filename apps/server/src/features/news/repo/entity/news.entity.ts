import { Document, Types } from 'mongoose';
import { WithTimeStampBaseEntity } from '../../../../models/repo/entity/base.entity';
import { SchoolShortEntity } from '../../../school/repo/school.entity';
import { UserShortEntity } from '../../../users/entities/user.entity';
import { NewsEntityDto } from '../dto/news-entity.dto';

function stringToObjectId(id: string | null | undefined): Types.ObjectId | null | undefined {
	if (id === null) {
		return null;
	}
	if (id === undefined) {
		return undefined;
	}
	return new Types.ObjectId(id);
}
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

	schoolId: Types.ObjectId | SchoolShortEntity;

	/** user id of creator */
	creatorId: Types.ObjectId | UserShortEntity;

	/** when updated, the user id of the updating user */
	updaterId?: Types.ObjectId;

	constructor(newsEntity: Partial<NewsEntity>) {
		super();
		Object.assign(this.title, newsEntity);
	}

	static fromNewsEntityDto(dto: NewsEntityDto): NewsEntity {
		const entity = new NewsEntity({
			title: dto.title,
			content: dto.content,
			displayAt: dto.displayAt,
			source: dto.source,
			externalId: dto.externalId,
			sourceDescription: dto.sourceDescription,
			target: stringToObjectId(dto.target),
			targetModel: dto.targetModel,
			schoolId: stringToObjectId(dto.school.id),
			creatorId: stringToObjectId(dto.creator.id),
			createdAt: dto.createdAt,
			updatedAt: dto.updatedAt,
		});

		return entity;
	}
}

export type NewsDocument = Document & NewsEntity;
