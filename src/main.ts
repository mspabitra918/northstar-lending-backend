import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);

//   // Allow the Next.js frontend to call the API from the browser. In production
//   // set FRONTEND_ORIGIN to the deployed site origin (comma-separated for many).
//   app.enableCors({
//     origin: process.env.FRONTEND_ORIGIN
//       ? process.env.FRONTEND_ORIGIN.split(',').map((o) => o.trim())
//       : ['http://localhost:3000'],
//     credentials: true,
//   });

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       transform: true,
//     }),
//   );

//   const config = new DocumentBuilder()
//     .setTitle('Northstar Lending API')
//     .setDescription('API documentation for Northstar Lending')
//     .setVersion('1.0')
//     .addBearerAuth()
//     .build();

//   const document = SwaggerModule.createDocument(app, config);

//   SwaggerModule.setup('api/docs', app, document);

//   await app.listen(process.env.PORT || 3001);

//   console.log(
//     `Swagger running at: http://localhost:${process.env.PORT || 3001}/api/docs`,
//   );
// }

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(',').map((o) => o.trim())
      : ['http://localhost:3000'],
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

  await app.init(); // ❗ IMPORTANT instead of listen()
}

bootstrap();
