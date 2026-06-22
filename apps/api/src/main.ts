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
  // Reflect any origin when CORS_ORIGINS is unset; restrict to the listed origins otherwise.
  app.enableCors({ origin: config.cors.origins ?? true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.enableShutdownHooks();

  // Bind 0.0.0.0 so the app is reachable inside a container (Railway, Docker, etc.).
  await app.listen(config.port, '0.0.0.0');
  logger.log(`UniDriver API listening on port ${config.port} at /api (${config.env})`);
  logger.log(`Adapter mode: ${config.adapterMode} · region: ${config.defaultRegion}`);
}

void bootstrap();
