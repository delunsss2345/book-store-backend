import { PrismaClientTransaction, PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { bookVariantInventorySelect } from '../select';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class BookVariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBookVariantInventoryById(bookVariantId: number, tx?: DbClient) {
    const db = this.getDb(tx);

    return db.bookVariant.findUnique({
      where: { id: bookVariantId },
      select: bookVariantInventorySelect,
    });
  }

  updateBookVariantInventory(
    params: {
      bookVariantId: number;
      stock: number;
      costPrice: number;
      price?: number;
    },
    tx?: DbClient,
  ) {
    const db = this.getDb(tx);

    return db.bookVariant.update({
      where: { id: params.bookVariantId },
      data: {
        stock: params.stock,
        costPrice: params.costPrice,
        ...(typeof params.price === 'number' ? { price: params.price } : {}),
      },
      select: bookVariantInventorySelect,
    });
  }

  updateReservedById(id: number, quantity: number, tx: PrismaClientTransaction) {
    return tx.bookVariant.update({
      where: { id },
      data: { reserved: { increment: quantity } },
    });
  }

  private getDb(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }
}
