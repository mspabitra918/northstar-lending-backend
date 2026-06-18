import { NestFactory } from '@nestjs/core';
import { IncomingMessage, ServerResponse } from 'http';
import { AppModule } from '../dist/src/app.module';
import { setupApp } from '../dist/src/setup';

let cachedServer: any;

async function createServer() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  setupApp(app);
  await app.init();

  return app.getHttpAdapter().getInstance(); // Express instance
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!cachedServer) {
    cachedServer = await createServer();
  }

  return cachedServer(req, res);
}
