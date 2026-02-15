import { BookSnapshotRepository } from '@/modules/book-snapshot/book-snapshot.repository';
import { Module } from '@nestjs/common';


@Module({
    providers: [BookSnapshotRepository],
    exports: [BookSnapshotRepository]
})
export class BookSnapShotModule { };