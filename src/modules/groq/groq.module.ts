import { GroqService } from '@/modules/groq/service/groq.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [GroqService],
  exports: [GroqService],
})
export class GroqModule {}
