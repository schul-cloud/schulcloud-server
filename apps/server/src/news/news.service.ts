import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ICurrentUser } from '../authentication/interfaces/jwt-payload';
import { AuthorizationService } from '../authorization/authorization.service';
import { CreateNewsDto, UpdateNewsDto } from '../models/news/news.dto';
import { News } from '../models/news/news.model';
import { School } from '../models/school/school.model';

import { NewsRepo } from './repos/news.repo';

type Permission = 'NEWS_VIEW' | 'NEWS_EDIT';
type Target = { targetModel: string; targetId: Types.ObjectId };
type AuthorizationSubject = { schoolId: Types.ObjectId | School; target?: Types.ObjectId; targetModel?: string };

@Injectable()
export class NewsService {
	constructor(private newsRepo: NewsRepo, private authorizationService: AuthorizationService) {}

	async create(createNewsDto: CreateNewsDto): Promise<any> {
		return {
			title: 'title',
			body: 'content',
			publishedOn: new Date(),
		};
	}

	async findAll(currentUser: ICurrentUser): Promise<News[]> {
		const { userId } = currentUser;
		// TODO pagination
		// TODO filter for current user
		const newsDocuments = await this.newsRepo.findAll();
		const newsEntities = await Promise.all(
			newsDocuments.map(async (news) => {
				const permissions = (
					await this.getUserPermissionsForSubject(new Types.ObjectId(userId), news)
				).filter((permission) => permission.includes('NEWS'));
				return new News({ ...news, permissions });
			})
		);
		return newsEntities;
	}

	async findOneByIdForUser(newsId: Types.ObjectId, userId: Types.ObjectId): Promise<News> {
		const news = await this.newsRepo.findOneById(newsId);
		news.permissions = (await this.getUserPermissionsForSubject(userId, news)).filter(
			(permission) => permission.includes('NEWS') // TODO impl
		);

		await this.authorizeUserReadNews(news, userId);
		return news;
	}

	private async authorizeUserReadNews(news: News, userId: Types.ObjectId): Promise<void> {
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
		if (requiredUserPermission in userPermissions) return;
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

	async getUserPermissionsForSubject(userId: Types.ObjectId, subject: AuthorizationSubject): Promise<string[]> {
		// detect scope of subject
		let scope: Target;
		if ('targetModel' in subject && subject.targetModel && 'target' in subject && subject.target) {
			const { target: targetId, targetModel } = subject;
			scope = { targetModel, targetId };
		} else if ('schoolId' in subject) {
			const { schoolId } = subject;
			scope = { targetModel: 'school', targetId: schoolId._id };
		} else {
			// data format not seems to be compatible, throw
			throw new UnauthorizedException('Bääm');
		}
		// scope is now school (generic) or a user group (specific)
		const permissions = await this.authorizationService.getUserPermissions(userId, scope);
		return permissions;
	}
}
