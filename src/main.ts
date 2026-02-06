import { TransformInterceptor } from '@/common';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { HttpExceptionFilter } from '@common/filters';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';
import "../polyfill";
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = AppModule.CONFIGURATION.GLOBAL_PREFIX;
  const port = AppModule.CONFIGURATION.APP_CONFIG.PORT;

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  const config = new DocumentBuilder()
    .setTitle('Book Store Api')
    .setVersion('1.0')
    .addTag('bookstore')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, documentFactory);
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}/docs`,
  );

}
bootstrap();
