import 'dotenv/config';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: false });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: false });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Finora API')
    .setDescription(
      'API RESTful de gestion de budget personnel : authentification JWT, catégories, transactions, budgets mensuels et rapports.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = Number.parseInt(process.env.PORT ?? '', 10) || 3000;
  await app.listen(port, '0.0.0.0');
  const address = app.getHttpServer().address();
  const activePort = typeof address === 'object' && address ? address.port : port;
  // eslint-disable-next-line no-console
  console.log(`Finora API prête sur http://localhost:${activePort}/api — documentation : /api/docs`);
}

void bootstrap();
