import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IncomingMessage, ServerResponse } from 'http';

import { AppModule } from './app.module';

// Builds and configures the Nest app, but does NOT bind a port. Shared by the
// serverless handler (Vercel) and the standalone listener (local / Node hosts).
async function createApp() {
  const app = await NestFactory.create(AppModule);

  // Allow the Next.js frontend to call the API from the browser. In production
  // set FRONTEND_ORIGIN to the deployed site origin (comma-separated for many).
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(',').map((o) => o.trim())
      : [
          'http://localhost:3000',
          'https://northstar-lending-frontend.vercel.app',
        ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Northstar Lending API')
    .setDescription('API documentation for Northstar Lending')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  return app;
}

// Serverless entrypoint (Vercel). The platform imports this module and invokes
// the default export per request; we boot the app once and reuse the underlying
// Express instance across warm invocations.
let cachedServer: ((req: IncomingMessage, res: ServerResponse) => void) | null =
  null;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!cachedServer) {
    const app = await createApp();
    await app.init(); // init() wires the app without binding a port
    cachedServer = app.getHttpAdapter().getInstance() as (
      req: IncomingMessage,
      res: ServerResponse,
    ) => void;
  }

  return cachedServer(req, res);
}

// Standalone entrypoint for local development and non-serverless hosts.
// Skipped on Vercel, where the platform drives the default export above.
if (!process.env.VERCEL) {
  void (async () => {
    const app = await createApp();
    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`API listening on http://localhost:${port}`);
  })();
}
