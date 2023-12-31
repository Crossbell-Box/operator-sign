import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { PrismaService } from '@/module/prisma/prisma.service';
import compression from '@fastify/compress';
import fastifySecureSession from '@fastify/secure-session';

export async function configure(
  app: NestFastifyApplication,
): Promise<NestFastifyApplication> {
  // logger
  const logger = app.get(Logger);
  app.useLogger(logger);
  logger.debug('loaded: Logger');

  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // dto validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  logger.debug('loaded: ValidationPipe');

  // versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // swagger
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Crossbell Operator Sign API')
      .setDescription('The API description of Crossbell Operator Sign')
      .setVersion('1.0')
      .setContact('Crossbell', 'https://crossbell.io', 'contact@crossbell.io')
      // .setLicense('License: MIT', 'https://opensource.org/licenses/MIT')
      .setExternalDoc('Discord community', 'https://discord.gg/4GCwDsruyj')
      .setTermsOfService('https://legal.xlog.app/Terms-of-Service')
      .addBearerAuth({ type: 'http', name: 'siwe' }, 'siwe')
      .build(),
  );
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Crossbell Operator Sign Doc',
    customfavIcon: 'https://crossbell.io/favicon.ico',
  });
  logger.debug('loaded: SwaggerModule');

  // prisma
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  logger.debug('loaded: PrismaService');

  // cors
  app.enableCors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    origin: true,
    credentials: true,
  });

  // @ts-expect-error session. see https://github.com/fastify/fastify-secure-session#using-a-secret
  app.register(fastifySecureSession, {
    secret: process.env.SESSION_SECRET,
    salt: process.env.SESSION_SALT,
    cookie: {
      // options for setCookie, see https://github.com/fastify/fastify-cookie
      path: '/',
      httpOnly: true, // Use httpOnly for all production purposes
      secure: process.env.NODE_ENV === 'production', // https only
      sameSite: 'none',
    },
  });

  // compression
  app.register(compression, { encodings: ['gzip', 'deflate'] });

  return app;
}
