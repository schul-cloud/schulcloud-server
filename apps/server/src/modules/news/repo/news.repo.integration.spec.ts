import * as moment from 'moment';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundError } from '@mikro-orm/core';
import { EntityId, SortOrder } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import {
	CourseInfo,
	CourseNews,
	News,
	NewsTargetModel,
	SchoolInfo,
	SchoolNews,
	TeamInfo,
	TeamNews,
	UserInfo,
} from '../entity';
import { NewsRepo } from './news.repo';

describe('NewsRepo', () => {
	let repo: NewsRepo;
	let em: EntityManager;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				MongoMemoryDatabaseModule.forRoot({
					entities: [News, CourseNews, CourseInfo, SchoolNews, SchoolInfo, TeamNews, TeamInfo, UserInfo],
				}),
			],
			providers: [NewsRepo],
		}).compile();

		repo = module.get(NewsRepo);
		em = module.get(EntityManager);
	});

	beforeEach(async () => {
		await em.nativeDelete(News, {});
	});

	afterAll(async () => {
		await module.close();
	});

	describe('defined', () => {
		it('repo should be defined', () => {
			expect(repo).toBeDefined();
		});

		it('entity manager should be defined', () => {
			expect(em).toBeDefined();
		});
	});

	const newTestNews = (
		schoolId: EntityId,
		targetModel: NewsTargetModel,
		targetId: EntityId,
		unpublished = false
	): News => {
		const displayAt = unpublished ? moment().add(1, 'days').toDate() : moment().subtract(1, 'days').toDate();
		const news = News.createInstance(targetModel, {
			school: schoolId,
			title: 'test course news',
			content: 'content',
			target: targetId,

			displayAt,
			creator: new ObjectId().toString(),
		});
		return news;
	};

	const createTestNews = async (
		schoolId: string,
		targetModel: NewsTargetModel,
		targetId: EntityId,
		unpublished = false
	): Promise<News> => {
		const news = newTestNews(schoolId, targetModel, targetId, unpublished);
		await em.persistAndFlush(news);
		return news;
	};

	const schoolId = new ObjectId().toString();

	describe('findAll', () => {
		it('should return news for targets', async () => {
			const courseId = new ObjectId().toString();
			const news = await createTestNews(schoolId, NewsTargetModel.Course, courseId);
			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [courseId],
			};
			const pagination = { skip: 0, limit: 20 };
			const [result, count] = await repo.findAll([target], false, { pagination });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return news for school', async () => {
			const news = await createTestNews(schoolId, NewsTargetModel.School, schoolId);
			const pagination = { skip: 0, limit: 20 };
			const target = {
				targetModel: NewsTargetModel.School,
				targetIds: [schoolId],
			};
			const [result, count] = await repo.findAll([target], false, { pagination });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return news for given target', async () => {
			const courseId = new ObjectId().toString();
			const news = await createTestNews(schoolId, NewsTargetModel.Course, courseId);
			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: [courseId],
			};
			const pagination = { skip: 0, limit: 20 };
			const [result, count] = await repo.findAll([target], false, { pagination });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(1);
			expect(result[0].id).toEqual(news.id);
		});

		it('should return news in requested order', async () => {
			const courseIds = Array.from(Array(5)).map(() => new ObjectId().toHexString());

			const createdNews = courseIds.map((courseId) => newTestNews(schoolId, NewsTargetModel.Course, courseId));
			await repo.saveAll(createdNews);
			const target = {
				targetModel: NewsTargetModel.Course,
				targetIds: courseIds,
			};
			const [result, count] = await repo.findAll([target], false, { order: { target: SortOrder.desc } });
			expect(count).toBeGreaterThanOrEqual(result.length);
			expect(result.length).toEqual(courseIds.length);
			const resultCourseIds = result.map((news) => news.target.id);
			const reverseCourseIds = courseIds.sort((r1, r2) => (r1 > r2 ? -1 : 1));
			expect(resultCourseIds).toEqual(reverseCourseIds);
		});
	});

	describe('save', () => {
		it('should create and persist a news entity', async () => {
			const courseId = new ObjectId().toString();
			const news = newTestNews(schoolId, NewsTargetModel.Course, courseId);
			await repo.save(news);
			expect(news.id).toBeDefined();
			const expectedNews = await em.findOne(News, news.id);
			expect(news).toStrictEqual(expectedNews);
		});
	});

	describe('saveAll', () => {
		it('should create multiple entities and save them', async () => {
			const courseIds = Array.from(Array(5)).map(() => new ObjectId().toHexString());
			const createdNews = courseIds.map((courseId) => newTestNews(schoolId, NewsTargetModel.Course, courseId));
			await repo.saveAll(createdNews);

			const newsIds = createdNews
				.filter((n) => !!n)
				.map((n) => n && n.id)
				.sort();
			expect(newsIds.length).toBe(courseIds.length);

			const expected = await Promise.all(createdNews.map(async (createdNews1) => repo.findOneById(createdNews1.id)));
			expect(expected.length).toBe(createdNews.length);

			const expectedIds = expected.map((n) => n && n.id).sort();
			expect(expectedIds).toStrictEqual(newsIds);
		});
	});

	describe('findOneById', () => {
		it('should find a news entity by id', async () => {
			const teamId = new ObjectId().toString();
			const news = await createTestNews(schoolId, NewsTargetModel.Team, teamId);
			const result = await repo.findOneById(news.id);
			expect(result).toStrictEqual(news);
		});

		it('should throw an exception if not found', async () => {
			const failNewsId = new ObjectId().toString();
			await expect(repo.findOneById(failNewsId)).rejects.toThrow(NotFoundError);
		});
	});

	describe('delete', () => {
		it('should delete news', async () => {
			const teamId = new ObjectId().toString();
			const news = await createTestNews(schoolId, NewsTargetModel.Team, teamId);

			await repo.delete(news);
			await expect(repo.findOneById(news.id)).rejects.toThrow(NotFoundError);
		});
	});
});
