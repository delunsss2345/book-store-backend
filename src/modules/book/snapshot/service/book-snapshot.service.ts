import { PrismaClientTransaction } from '@/database';
import { CreateBookSnapshotDto } from '@/modules/book/snapshot/dto/request/create-book-snapshot.dto';
import { Injectable } from '@nestjs/common';
import { BookSnapshotRepository } from '../repository/book-snapshot.repository';

@Injectable()
export class BookVariantSnapshotService {
  constructor(private readonly bookSnapshotRepository: BookSnapshotRepository) {}

  upsertByContentHash(contentHash: string, dto: CreateBookSnapshotDto, tx: PrismaClientTransaction) {
    return this.bookSnapshotRepository.upsertByContentHash(contentHash, dto, tx);
  }
}
