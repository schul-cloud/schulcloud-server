import { NewsEntity } from '../entity/news.entity';
import { Types } from 'mongoose';

function objectIdToString(id: Types.ObjectId | null | undefined): string | null | undefined {
	if (id === null) {
		return null;
	}
	if (id === undefined) {
		return undefined;
	}
	return id.toHexString();
}
export class NewsEntityDto {
	id: string;
	title: string;
	content: string;
	displayAt: Date;
	source: 'internal' | 'rss';
	externalId?: string;
	sourceDescription?: string;
	target?: string;
	targetModel?: string;
	school: {
		id: string;
		name?: string;
	};
	creator: {
		id: string;
		firstName?: string;
		lastName?: string;
	};
	updater?: {
		id: string;
		firstName?: string;
		lastName?: string;
	};
	createdAt: Date;
	updatedAt?: Date;

	static fromNewsEntity(entity: NewsEntity) {
		const dto = new NewsEntityDto();
		dto.id = objectIdToString(entity._id);
		dto.title = entity.title;
		dto.content = entity.content;
		dto.displayAt = entity.displayAt;
		dto.source = entity.source;
		if ('externalId' in entity) dto.externalId = entity.externalId;
		if ('sourceDescription' in entity) dto.sourceDescription = entity.sourceDescription;
		if ('target' in entity) dto.target = objectIdToString(entity.target);
		if ('targetModel' in entity) dto.targetModel = entity.targetModel;
		dto.createdAt = entity.createdAt;
		if ('updatedAt' in entity) dto.updatedAt = entity.updatedAt;
		if ('id' in entity.schoolId) {
			dto.school = entity.schoolId;
		} else {
			dto.school = {
				id: (entity.schoolId as Types.ObjectId).toHexString(),
			};
		}
		if ('id' in entity.creatorId) {
			dto.creator = entity.creatorId;
		} else {
			dto.creator = {
				id: (entity.creatorId as Types.ObjectId).toHexString(),
			};
		}
		if (entity.updaterId) {
			if ('id' in entity.updaterId) {
				dto.updater = entity.updaterId;
			} else {
				dto.updater = {
					id: (entity.updaterId as Types.ObjectId).toHexString(),
				};
			}
		}
		return dto;
	}
}
