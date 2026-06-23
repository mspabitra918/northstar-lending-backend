import { NestFactory } from '@nestjs/core';
import { IncomingMessage, ServerResponse } from 'http';

import { AppModule } from './app.module';
import { setupApp } from './setup';

// Builds and configures the Nest app, but does NOT bind a port. Shared by the
// serverless handler (Vercel) and the standalone listener (local / Node hosts).
async function createApp() {
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  setupApp(app);

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
