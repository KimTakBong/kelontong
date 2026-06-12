import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import session from 'express-session';
import passport from 'passport';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { AppModule } from './app.module';
import { validationExceptionFactory } from './common/pipes/validation-exception.factory';
import { UPLOAD_DIR, UPLOAD_ROUTE } from './uploads/uploads.constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const isProd = process.env.NODE_ENV === 'production';

  // ── Serve locally-stored product images at /uploads/<filename> ──
  app.useStaticAssets(UPLOAD_DIR, { prefix: UPLOAD_ROUTE });

  // ── CORS (credentials so the session cookie is allowed cross-origin) ──
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // ── Session store backed by PostgreSQL ──
  const PgSession = connectPgSimple(session);
  const sessionPool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'klontong_admin',
  });

  app.use(
    session({
      store: new PgSession({
        pool: sessionPool,
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET ?? 'dev-secret-change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProd, // requires HTTPS in production
        sameSite: 'lax',
        maxAge: parseInt(process.env.SESSION_MAX_AGE ?? '86400000', 10),
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  // ── Global validation: strip unknown props, coerce types, structured errors ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: validationExceptionFactory,
    }),
  );

  app.setGlobalPrefix('api');

  // ── Swagger / OpenAPI at /api/docs ──
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Klontong Admin API')
    .setDescription('REST API untuk sistem manajemen produk toko klontong')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(process.env.PORT ?? '3001', 10);
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

void bootstrap();
