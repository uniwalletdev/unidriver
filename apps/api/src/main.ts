import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { loadConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = new Logger('Bootstrap');

  // Initialise Sentry before the app so early errors are captured (spec §3, §13).
  if (config.sentry.dsn) {
    Sentry.init({
      dsn: config.sentry.dsn,
      environment: config.env,
      tracesSampleRate: config.sentry.tracesSampleRate,
    });
    logger.log('Sentry initialised');
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  app.setGlobalPrefix('api');
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.enableShutdownHooks();

  await app.listen(config.port);
  logger.log(`UniDriver API listening on http://localhost:${config.port}/api (${config.env})`);
  logger.log(`Adapter mode: ${config.adapterMode} · region: ${config.defaultRegion}`);
}

void bootstrap();
