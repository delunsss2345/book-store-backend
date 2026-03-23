import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type DbClient = Prisma.TransactionClient | PrismaService;

const bookVariantInventorySelect = {
  id: true,
  stock: true,
  costPrice: true,
  price: true,
} satisfies Prisma.BookVariantSelect;

@Injectable()
export class BookVariantRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBookVariantInventoryById(bookVariantId: bigint, tx?: DbClient) {
    const db = this.getDb(tx);

    return db.bookVariant.findUnique({
      where: { id: bookVariantId },
      select: bookVariantInventorySelect,
    });
  }

  updateBookVariantInventory(
    params: {
      bookVariantId: bigint;
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

  private getDb(tx?: DbClient): DbClient {
    return tx ?? this.prisma;
  }
}
