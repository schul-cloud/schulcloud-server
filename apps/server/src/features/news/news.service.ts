import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ICurrentUser } from '../../modules/authentication/interfaces/jwt-payload';
import { AuthorizationService } from '../../modules/authorization/authorization.service';
import { CreateNewsDto, UpdateNewsDto } from './controller/dto/news.dto';
import { PaginationDTO } from '../../models/controller/dto/pagination.dto';
import { NewsRepo } from './repo/news.repo';
import { News } from './bo/news.bo';
import { NewsEntityDto } from './repo/dto/news-entity.dto';
import { SchoolShortEntity } from '../school/repo/school.entity';

type Permission = 'NEWS_VIEW' | 'NEWS_EDIT';
type Target = { targetModel: string; targetId: Types.ObjectId };
type AuthorizationSubject = {
	school: SchoolShortEntity;
	target?: Types.ObjectId;
	targetModel?: string;
};

// CONSIDER https://github.com/devonfw/devon4j/blob/master/documentation/guide-service-layer.asciidoc#service-considerations

@Injectable()
export class NewsService {
	constructor(private newsRepo: NewsRepo, private authorizationService: AuthorizationService) {}

	async create(createNewsDto: CreateNewsDto): Promise<News> {
		const newsEntity = await this.newsRepo.create(this.mapToNewsEntity(createNewsDto));
		const news = this.mapFromNewsEntity(newsEntity);
		return news;
	}

	async findAllForUser(currentUser: ICurrentUser, pagination: PaginationDTO): Promise<NewsEntity[]> {
		const userId = new Types.ObjectId(currentUser.userId);
		// TODO pagination
		// TODO filter for current user
		const newsEntities = await this.newsRepo.findAllByUser(userId, pagination);
		const news = await Promise.all(
			newsEntities.map(async (entity: NewsEntityDto) => {
				const news = this.mapFromNewsEntity(entity);
				news.permissions = await this.getPermissions(entity, userId);
				// TODO await this.authorizeUserReadNews(news, userId);
				return news;
			})
		);
		return newsEntities;
	}

	async findOneByIdForUser(newsId: Types.ObjectId, userId: Types.ObjectId): Promise<News> {
		const newsEntity = await this.newsRepo.findOneById(newsId);
		const news = this.mapFromNewsEntity(newsEntity);
		news.permissions = await this.getPermissions(newsEntity, userId);
		await this.authorizeUserReadNews(news, userId);
		return news;
	}

	private async authorizeUserReadNews(news: NewsEntity, userId: Types.ObjectId): Promise<void> {
		let requiredUserPermission: Permission | null = null;
		const userPermissions = news.permissions;
		// todo new Date was Date.now() before
		if (news.displayAt > new Date()) {
			// request read permission for published news
			requiredUserPermission = 'NEWS_VIEW';
		} else {
			// request write permission for unpublished news
			requiredUserPermission = 'NEWS_EDIT';
		}
		if (userPermissions.includes(requiredUserPermission)) return;
		throw new UnauthorizedException('Nee nee nee...');
	}

	async update(id: Types.ObjectId, updateNewsDto: UpdateNewsDto): Promise<any> {
		return {
			title: 'title',
			body: 'content',
			publishedOn: new Date(),
		};
	}

	async remove(id: string) {
		return id;
	}

	private mapFromNewsEntity(newsEntity: NewsEntityDto): News {
		const news = new News();
		news.id = newsEntity.id;
		news.title = newsEntity.title;
		news.content = newsEntity.content;
		news.displayAt = newsEntity.displayAt;
		news.externalId = newsEntity.externalId;
		news.sourceDescription = newsEntity.sourceDescription;
		news.target = newsEntity.target as any;
		news.targetModel = newsEntity.targetModel;

		news.school = newsEntity.school;
		news.creator = newsEntity.creator;
		news.updater = newsEntity.updater;

		// news.createdAt = newsEntity.createdAt;
		// news.updatedAt = newsEntity.updatedAt;

		return news;
	}

	private mapToNewsEntity(createNewsDto: CreateNewsDto): NewsEntityDto {
		const dto = new NewsEntityDto();
		dto.title = createNewsDto.title;
		dto.content = createNewsDto.body;
		dto.displayAt = createNewsDto.publishedOn;
		return dto;
	}

	private async getPermissions(news: News, userId: Types.ObjectId): Promise<string[]> {
		const permissions = (await this.getUserPermissionsForSubject(userId, news)).filter((permission) =>
			permission.includes('NEWS')
		);
		return permissions;
	}

	private async getUserPermissionsForSubject(userId: Types.ObjectId, subject: News): Promise<string[]> {
		// detect scope of subject
		let scope: Target;
		if ('targetModel' in subject && subject.targetModel && 'target' in subject && subject.target) {
			const { target: targetId, targetModel } = subject;
			scope = { targetModel, targetId };
		} else if ('school' in subject) {
			scope = { targetModel: 'school', targetId: new Types.ObjectId(subject.school.id) };
		} else {
			// data format not seems to be compatible, throw
			throw new UnauthorizedException('Bääm');
		}
		// scope is now school (generic) or a user group (specific)
		const permissions = await this.authorizationService.getUserPermissions(userId, scope);
		return permissions;
	}
}
