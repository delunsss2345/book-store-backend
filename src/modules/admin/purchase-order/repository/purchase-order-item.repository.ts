import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { purchaseOrderItemSelect } from '../select';

type DbClient = Prisma.TransactionClient | PrismaService;

export type CreatePurchaseOrderItemInput = {
  bookVariantId: number;
  quantity: number;
  unitPrice: number;
  discountPrice: number;
  price: number;
  totalPrice: number;
};

@Injectable()
export class PurchaseOrderItemRepository {
  constructor(private readonly prisma: PrismaService) { }

  createPurchaseOrderItems(
    purchaseOrderId: string,
    items: CreatePurchaseOrderItemInput[],
    tx: DbClient = this.prisma,
  ) {
    if (!items.length) return Promise.resolve({ count: 0 });
    return tx.purchaseOrderItem.createMany({
      data: items.map((item) => ({
        purchaseOrderId,
        bookVariantId: item.bookVariantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPrice: item.discountPrice,
        price: item.price,
        totalPrice: item.totalPrice,
      })),
    });
  }

  findPurchaseOrderItemsByPurchaseOrderId(
    purchaseOrderId: string,
    tx: DbClient = this.prisma,
  ) {
    return tx.purchaseOrderItem.findMany({
      where: { purchaseOrderId },
      select: purchaseOrderItemSelect,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async findPurchaseOrderItemByVariantIdAndId(variantId: number, purchaseOrderItemId: string) {
    return this.prisma.purchaseOrderItem.findFirst({
      where: {
        bookVariantId: variantId,
        id: purchaseOrderItemId,
      },
      select: { id: true, unitPrice: true },
    });
  }
}
