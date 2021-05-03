import { Injectable, NotFoundException } from '@nestjs/common';
import { Document, LeanDocument, Model, Query, Types } from 'mongoose';
import legacyConstants = require('../../../../../../src/services/news/constants');
import { InjectModel } from '@nestjs/mongoose';
import { UpdateNewsDto } from '../controller/dto/news.dto';
import { PaginationModel } from '../../../models/repo/interface/pagination.interface';
import { NewsDocument, NewsEntity } from './entity/news.entity';
import { NewsEntityDto } from './dto/news-entity.dto';

const { populateProperties } = legacyConstants;

// TODO move...
/** Takes a query to enable pagination */
function QueryBuilder<T extends Document>(query: Query<T[], T>) {
	return {
		/**
		 * enable pagination for a given query.
		 * all members must return the query to enable chaining
		 */
		paginate: (pagination?: PaginationModel): Query<T[], T> => {
			if (pagination == null) {
				return query;
			}
			if (pagination.limit != null) {
				query = query.limit(pagination.limit);
			}
			if (pagination.skip != null) {
				query = query.skip(pagination.skip);
			}
			return query;
		},
		// TODO add more fancy query builders ()=$")=%§)="
	};
}

@Injectable()
export class NewsRepo {
	constructor(@InjectModel('News') private readonly newsModel: Model<NewsDocument>) {}

	async create(dto: NewsEntityDto): Promise<NewsEntityDto> {
		const newsEntity = NewsEntity.fromNewsEntityDto(dto);
		const newsDocument = await this.newsModel.create(newsEntity);
		const resultDto = NewsEntityDto.fromNewsEntity(newsDocument);
		return resultDto;
	}

	async findAllByUser(userId: Types.ObjectId, pagination?: PaginationModel): Promise<NewsEntityDto[]> {
		let query = this.newsModel.find();
		// TODO filter by user scopes
		populateProperties.forEach((populationSet) => {
			const { path, select } = populationSet;
			query = query.populate(path, select);
		});
		query = QueryBuilder<NewsDocument>(query).paginate(pagination);
		const newsDocuments = await query.lean().exec();
		const resultDtos = newsDocuments.map((doc) => {
			return NewsEntityDto.fromNewsEntity(doc);
		});

		return resultDtos;
	}

	/** resolves a news document with some elements names (school, updator/creator) populated already */
	async findOneById(id: Types.ObjectId): Promise<NewsEntityDto> {
		let query = this.newsModel.findById(id);
		populateProperties.forEach((populationSet) => {
			const { path, select } = populationSet;
			query = query.populate(path, select);
		});
		const newsDocument = await query.lean().exec();
		// NOT EXPORT A DOCUMENT, HERE WE KNOW WHAT THE DB HAS RETURNED
		// FOR UPPER LAYERS ONLY WE MUST PROVIDE TYPESAFETY
		// THIS MIGHT CHANGE WHEN WE USE A NON_LEGACY MODEL FACTORY
		if (newsDocument == null) {
			throw new NotFoundException('The requested news ' + id + 'has not been found.');
		}
		const resultDto = NewsEntityDto.fromNewsEntity(newsDocument);
		return resultDto;
	}

	update(id: string, updateNewsDto: UpdateNewsDto) {
		return `This action updates a #${id} news`;
	}

	remove(id: string) {
		return `This action removes a #${id} news`;
	}
}
function toNews(newsDocument: LeanDocument<NewsDocument>): NewsEntity {
	// move populated properties to other named property and restore id's like without population
	// sample: schoolId:{...} to schoolId:ObjectId and school:{...}
	populateProperties.forEach(({ path, target }) => {
		if (target && path in newsDocument) {
			const id = newsDocument[path]._id;
			newsDocument[target] = newsDocument[path];
			newsDocument[path] = id;
		}
	});
	// const news = plainToClass(News, newsDocument, {
	// 	/** remove properties not exported in @News */
	// 	excludeExtraneousValues: true,
	// 	/** For undefined properties, apply defaults defined within of @News */
	// 	exposeDefaultValues: true,
	// });
	const news = new NewsEntity(newsDocument);
	return news;
}

/** document to dto conversion */
// function toNews(newsDocument: LeanDocument<NewsFullDocument>): NewsFullDto {
// 	const newsDto = new NewsFullDto({
// 		...newsDocument,
// 		school: newsDocument.schoolId as PickSchoolEntity,
// 		creator: newsDocument.creatorId as PickUserEntity,
// 		updater: newsDocument.updaterId as PickUserEntity,
// 	});
// 	return newsDto;
// }
