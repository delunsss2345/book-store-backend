import { WorkerModule } from '@/worker.module';
import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
async function bootstrap() {
    await NestFactory.createApplicationContext(WorkerModule);
}
bootstrap();
