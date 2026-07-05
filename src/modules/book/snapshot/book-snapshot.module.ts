import { Module } from '@nestjs/common';
import { BookSnapshotRepository } from './repository/book-snapshot.repository';
import { BookVariantSnapshotService } from './service/book-snapshot.service';

@Module({
    providers: [BookSnapshotRepository, BookVariantSnapshotService],
    exports: [BookSnapshotRepository, BookVariantSnapshotService],
})
export class BookSnapShotModule { };
