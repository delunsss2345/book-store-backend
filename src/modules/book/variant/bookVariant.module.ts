import { Module } from '@nestjs/common';
import { BookVariantRepository } from './repository/bookVariant.repository';
import { BookVariantService } from './service/bookVariant.service';

@Module({
  providers: [BookVariantRepository, BookVariantService],
  exports: [BookVariantRepository, BookVariantService],
})
export class BookVariantModule {}
