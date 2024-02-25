import { AppModule } from '@/app.module';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe, patchNestjsSwagger } from '@anatine/zod-nestjs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from '@/common/logging.interceptor';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://social-auth-nextjs.vercel.app/',
    ],
    credentials: true,
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new LoggingInterceptor(new Logger()));

  const config = new DocumentBuilder()
    .setTitle(`NestJS API`)
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  patchNestjsSwagger();
  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('/swagger-html', app, document, {
    swaggerOptions: {
      tagsSorter: 'alpha',
      docExpansion: 'none',
    },
    jsonDocumentUrl: '/swagger-json',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.7/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.7/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.7/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.7/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.7/swagger-ui.css',
    ],
  });
  await app.listen(8000);
}

bootstrap();
