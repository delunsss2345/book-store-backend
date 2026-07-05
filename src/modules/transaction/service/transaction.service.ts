import { PrismaClientTransaction, PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  // Bọc prisma.$transaction để các service chạy nhiều thao tác trong cùng 1 transaction
  doInTransaction<T>(
    callback: (tx: PrismaClientTransaction) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction((tx) => callback(tx));
  }
}
