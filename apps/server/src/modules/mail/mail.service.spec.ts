import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailModule } from './mail.module';

describe.skip('MailService', () => {
	let service: MailService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [MailModule, MailService],
		}).compile();

		service = module.get<MailService>(MailService);
	});

	it.todo('should be defined', () => {
		expect(service).toBeDefined();
	});
});
