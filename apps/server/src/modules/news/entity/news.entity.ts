import { AnyEntity, Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity, BaseEntityWithTimestamps } from '../../../shared/domain';
import { SchoolInfo } from './school-info.entity';
import { UserInfo } from './user-info.entity';

const NEWS_TARGET_MODELS = ['courses', 'teams'] as const;
export type NewsTargetModel = typeof NEWS_TARGET_MODELS[number];
@Entity()
export class News extends BaseEntityWithTimestamps {
	/** the news title */
	@Property()
	title!: string;

	/** the news content as html */
	@Property()
	content!: string;

	/** only past news are visible for viewers, when edit permission, news visible in the future might be accessed too  */
	@Property()
	displayAt!: Date;

	@Property()
	externalId?: string;

	@Property()
	source?: 'internal' | 'rss';

	@Property()
	sourceDescription?: string;

	/** id reference to a collection */
	@ManyToOne()
	target?: BaseEntity;

	/** name of a collection which is referenced in target */
	@Property()
	targetModel?: NewsTargetModel;

	@ManyToOne({ fieldName: 'schoolId' })
	school: SchoolInfo;

	@ManyToOne({ fieldName: 'creatorId' })
	creator: UserInfo;

	@ManyToOne({ fieldName: 'updaterId' })
	updater?: UserInfo;

	permissions: string[] = [];

	constructor(props: { title: string; content: string; displayAt: Date }) {
		super();
		this.title = props.title;
		this.content = props.content;
		this.displayAt = props.displayAt;
	}
}
