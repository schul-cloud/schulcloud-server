import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import legacyAppPromise = require('../../../src/app');

import { ServerModule } from './server.module';
import path = require('path');

const ROUTE_PRAEFIX = 'v2';
const API_PATH = 'api';
const PORT = 3030;

async function bootstrap() {
	// load the legacy feathers/express server
	const legacyApp = await legacyAppPromise;
	const adapter = new ExpressAdapter(legacyApp);

	// create the NestJS application adapting the legacy  server
	const app = await NestFactory.create(ServerModule, adapter);

	/**
	 * Global Pipe setup
	 */
	// transform and -options enables setting of defaults or initialization of empty arrays
	app.useGlobalPipes(
		// validation pipe ensures DTO validation globally
		new ValidationPipe({
			transform: true, // enable DTO instance creation
			transformOptions: {
				enableImplicitConversion: true, // enable type coersion, requires transform:true
			},
			whitelist: true, // only pass DTO properties with @ApiProperty decorator, remove others
		})
	);

	// for all NestJS controller routes, prepend ROUTE_PRAEFIX
	app.setGlobalPrefix(ROUTE_PRAEFIX);

	/**
	 * OpenAPI setup
	 */

	// build default openapi spec, it contains all registered controllers by default
	// DTO's and Entity properties have to use @ApiProperty decorator to add their properties // TODO make this default?
	const config = new DocumentBuilder()
		.setTitle('HPI Schul-Cloud Server API')
		.setDescription('This is /v2 of HPI Schul-Cloud Server')
		.setVersion('2.0')
		/** set authentication for all routes enabled by default */
		.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	const apiDocsPath = path.join(ROUTE_PRAEFIX, API_PATH);
	SwaggerModule.setup(apiDocsPath, app, document);

	await app.init();

	adapter.listen(PORT);
}
bootstrap();
