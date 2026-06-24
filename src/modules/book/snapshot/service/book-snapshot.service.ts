import { PrismaClientTransaction } from '@/database';
import { CreateBookSnapshotDto } from '@/modules/book/snapshot/dto/request/create-book-snapshot.dto';
import { Injectable } from '@nestjs/common';
import { BookFormat } from '@prisma/client';
import { BookSnapshotRepository } from '../repository/book-snapshot.repository';

@Injectable()
export class BookVariantSnapshotService {
  constructor(private readonly bookSnapshotRepository: BookSnapshotRepository) { }

  upsertByContentHash(contentHash: string, dto: CreateBookSnapshotDto, tx: PrismaClientTransaction) {
    return this.bookSnapshotRepository.upsertByContentHash(contentHash, dto, tx);
  }

  createMany(items: {
    contentHash: string;
    bookVariantId: number;
    priceSnapshot: number;
    formatSnapshot: BookFormat;
  }[]) {
    return this.bookSnapshotRepository.createMany(items);
  }

  findAllByContentHashes(contentHashes: string[]) {
    return this.bookSnapshotRepository.findAllByContentHashes(contentHashes);
  }
}
