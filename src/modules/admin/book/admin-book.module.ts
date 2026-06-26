import { CacheProvider } from '@/config/redis.config';
import { AuditLogModule } from '@/modules/audit-log/audit-log.module';
import { AuthorModule } from '@/modules/author/author.module';
import { LanguageModule } from '@/modules/language/language.module';
import { PublisherModule } from '@/modules/publisher/publisher.module';
import { Module } from '@nestjs/common';
import { AdminBookVariantModule } from '../book-variant/admin-book-variant.module';
import { AdminBookSnapshotController } from './controller/admin-book-snapshot.controller';
import { AdminBookTranslationController } from './controller/admin-book-translation.controller';
import { AdminBookController } from './controller/admin-book.controller';
import { AdminBookRepository } from './repository/admin-book.repository';
import { AdminBookService } from './service/admin-book.service';

@Module({
  imports: [
    CacheProvider,
    LanguageModule,
    AuditLogModule,
    PublisherModule,
    AuthorModule,
    AdminBookVariantModule,
  ],
  controllers: [
    AdminBookController,
    AdminBookTranslationController,
    AdminBookSnapshotController,
  ],
  providers: [AdminBookService, AdminBookRepository],
  exports: [AdminBookService, AdminBookRepository],
})
export class AdminBookModule { }
