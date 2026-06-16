import { Module } from '@nestjs/common';
import { BookSnapshotRepository } from './repository/book-snapshot.repository';


@Module({
    providers: [BookSnapshotRepository],
    exports: [BookSnapshotRepository]
})
export class BookSnapShotModule { };
