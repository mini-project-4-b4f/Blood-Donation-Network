import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { createValidationPipe } from './common/validation.pipe';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: 'http://localhost:5173' });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Blood Donation Network API')
    .setDescription(
      'Emergency blood donation coordination platform. Matches urgent hospital blood requests ' +
        'with active, compatible, same-area donors outside their rest period. ' +
        'This is a coordination tool, not a medical screening system.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Areas')
    .addTag('Requests')
    .addTag('Donations')
    .addTag('Donors')
    .addTag('Pledges')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API:     http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`Swagger: http://localhost:${port}/api/docs`);
}

void bootstrap();
