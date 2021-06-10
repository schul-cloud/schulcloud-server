import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { LoggerModule } from '@src/core/logger/logger.module';
import { ICreateNews } from '../entity/news.types';

import { AuthorizationService } from '../../authorization/authorization.service';
import { NewsRepo } from '../repo/news.repo';
import { NewsUc } from './news.uc';
import { NewsTargetModel } from '../entity';

describe('NewsUc', () => {
	let service: NewsUc;
	let repo: NewsRepo;
	const userId = new ObjectId().toString();
	const schoolId = new ObjectId().toString();
	const pagination = {};
	const courseTargetId = 'course1';
	const teamTargetId = 'team1';
	const targets = [
		{
			targetModel: NewsTargetModel.Course,
			targetIds: [courseTargetId],
		},
		{
			targetModel: NewsTargetModel.Team,
			targetIds: [teamTargetId],
		},
	];

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule],
			providers: [
				NewsUc,
				{
					provide: NewsRepo,
					useValue: {
						save() {
							return {};
						},
						findAll() {
							return [[], 0];
						},
					},
				},
				{
					provide: AuthorizationService,
					useValue: {
						checkEntityPermissions() {},
						// eslint-disable-next-line @typescript-eslint/no-shadow
						getPermittedEntities(userId, targetModel, permissions) {
							return targets
								.filter((target) => target.targetModel === targetModel)
								.flatMap((target) => target.targetIds);
						},
						getEntityPermissions() {},
					},
				},
			],
		}).compile();

		service = module.get<NewsUc>(NewsUc);
		repo = module.get<NewsRepo>(NewsRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAllByUser', () => {
		it('should search for news by empty scope ', async () => {
			const scope = {};
			const findAllSpy = jest.spyOn(repo, 'findAll');
			await service.findAllForUser(userId, scope, pagination);
			const expectedParams = [targets, false, pagination];
			expect(findAllSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for school news with given school id', async () => {
			const scope = {
				target: {
					targetModel: NewsTargetModel.School,
					targetId: schoolId,
				},
			};
			const findAllBySchoolSpy = jest.spyOn(repo, 'findAll');
			await service.findAllForUser(userId, scope, pagination);
			const expectedTarget = {
				targetModel: scope.target.targetModel,
				targetIds: [scope.target.targetId],
			};
			const expectedParams = [[expectedTarget], false, pagination];
			expect(findAllBySchoolSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for course news with given courseId', async () => {
			const scope = {
				target: {
					targetModel: NewsTargetModel.Course,
					targetId: courseTargetId,
				},
			};
			const findAllByCourseSpy = jest.spyOn(repo, 'findAll');
			await service.findAllForUser(userId, scope, pagination);
			const expectedTarget = {
				targetModel: scope.target.targetModel,
				targetIds: [scope.target.targetId],
			};
			const expectedParams = [[expectedTarget], false, pagination];
			expect(findAllByCourseSpy).toHaveBeenCalledWith(...expectedParams);
		});
		it('should search for all course news if course id is not given', async () => {
			const targetModel = NewsTargetModel.Course;
			const scope = { target: { targetModel } };
			const findAllByTargetSpy = jest.spyOn(repo, 'findAll');
			await service.findAllForUser(userId, scope, pagination);
			const targetIds = targets
				.filter((target) => target.targetModel === targetModel)
				.flatMap((target) => target.targetIds);
			const expectedTarget = { targetModel, targetIds };
			const expectedParams = [[expectedTarget], false, pagination];
			expect(findAllByTargetSpy).toHaveBeenCalledWith(...expectedParams);
		});
	});
	describe('create', () => {
		it('should assign all required properties to news object', async () => {
			const createSpy = jest.spyOn(repo, 'save');
			const params = {
				title: 'title',
				content: 'content',
				displayAt: new Date(),
				target: { targetModel: NewsTargetModel.School, targetId: schoolId },
			} as ICreateNews;
			await service.create(userId, schoolId, params);
			expect(createSpy).toHaveBeenCalled();
			const newsProps = createSpy.mock.calls[0][0];
			expect(newsProps.school.id === schoolId);
			expect(newsProps.creator.id === userId);
		});

		it('should assign target to news object', async () => {
			const courseId = new ObjectId().toString();
			const createSpy = jest.spyOn(repo, 'save');
			const params = {
				title: 'title',
				content: 'content',
				displayAt: new Date(),
				target: { targetModel: 'courses', targetId: courseId },
			} as ICreateNews;
			await service.create(userId, schoolId, params);
			expect(createSpy).toHaveBeenCalled();
			const newsProps = createSpy.mock.calls[0][0];
			expect(newsProps.school.id === schoolId);
			expect(newsProps.creator.id === userId);
			expect(newsProps.targetModel === 'courses');
			expect(newsProps.target.id === courseId);
		});

		// TODO test authorization
	});
});
