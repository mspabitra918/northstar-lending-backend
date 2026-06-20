import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Single source of truth for app configuration, shared by the serverless
// entrypoint (api/index.ts on Vercel) and the standalone listener (main.ts).
export function setupApp(app: INestApplication) {
  app.setGlobalPrefix('api');

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
  // Resolves to /api/docs because of the global prefix set above.
  SwaggerModule.setup('docs', app, document);
}
