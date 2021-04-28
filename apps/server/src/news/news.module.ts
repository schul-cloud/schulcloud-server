import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsRepo } from './repos/news.repo';
import { NewsController } from './news.controller';
import { NewsSchema } from './repos/schemas/news.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
	imports: [MongooseModule.forFeature([{ name: 'News', schema: NewsSchema }])],
	controllers: [NewsController],
	providers: [NewsService, NewsRepo],
	exports: [NewsService],
})
export class NewsModule {}
