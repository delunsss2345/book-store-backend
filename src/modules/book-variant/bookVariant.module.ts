import { Module } from '@nestjs/common';
import { BookVariantRepository } from './bookVariant.repository';
import { BookVariantService } from './bookVariant.service';

@Module({
  providers: [BookVariantRepository, BookVariantService],
  exports: [BookVariantRepository, BookVariantService],
})
export class BookVariantModule {}
