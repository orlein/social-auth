import { AppModule } from '@/app.module';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe, patchNestjsSwagger } from '@anatine/zod-nestjs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ZodValidationPipe());

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
  await app.listen(3000);
}

bootstrap();
