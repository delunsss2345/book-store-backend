import { PrismaService } from '@/database';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderItemRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrdersQueryDto,
} from './dto';

type DbClient = Prisma.TransactionClient | PrismaService;

const purchaseOrderItemSelect = {
  id: true,
  purchaseOrderId: true,
  bookVariantId: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true,
  createdAt: true,
  updatedAt: true,
};

const purchaseOrderDetailSelect = {
  id: true,
  supplierId: true,
  code: true,
  status: true,
  note: true,
  totalAmount: true,
  taxAmount: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: purchaseOrderItemSelect,
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  },
};

@Injectable()
export class PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  withTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction((tx) => callback(tx));
  }

  async createPurchaseOrder(
    createdById: bigint,
    body: CreatePurchaseOrderRequestDto,
    tx?: DbClient,
  ) {
    const db = this.getDb(tx);
    const supplierId = BigInt(body.supplierId);
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true },
    });

    if (!supplier) {
      throw new BadRequestException('Invalid supplier');
    }

    return db.purchaseOrder.create({
      data: {
        supplierId,
        code: body.code,
        createdById: createdById.toString(),
        createdAt: this.toDate(body.createdAt),
        note: body.note,
        totalAmount: body.totalAmount,
        taxAmount: body.taxAmount,
      },
      select: {
        id: true,
        supplierId: true,
        code: true,
        status: true,
        note: true,
        totalAmount: true,
        taxAmount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findPurchaseOrders(query: GetPurchaseOrdersQueryDto) {
    throw new Error('Method not implemented.');
  }

  findPurchaseOrderById(purchaseOrderId: string, tx?: DbClient) {
    const db = this.getDb(tx);
    return db.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: purchaseOrderDetailSelect,
    });
  }

  findPurchaseOrderByCode(code: string, tx?: DbClient) {
    const db = this.getDb(tx);
    return db.purchaseOrder.findUnique({
      where: { code },
      select: purchaseOrderDetailSelect,
    });
  }

  approvePurchaseOrder(
    purchaseOrderId: string,
    approvedById: bigint,
    body?: ApprovePurchaseOrderRequestDto,
  ) {
    throw new Error('Method not implemented.');
  }

  async createPurchaseOrderItems(
    purchaseOrderId: string,
    items: CreatePurchaseOrderItemRequestDto[],
    tx?: DbClient,
  ) {
    if (!items.length) {
      return [];
    }

    const db = this.getDb(tx);
    const bookVariantIds = [...new Set(items.map((item) => BigInt(item.bookVariantId)))];
    const existingBookVariants = await db.bookVariant.findMany({
      where: {
        id: {
          in: bookVariantIds,
        },
      },
      select: { id: true },
    });

    const existingIds = new Set(
      existingBookVariants.map((item) => item.id.toString()),
    );
    const missingIds = bookVariantIds
      .filter((id) => !existingIds.has(id.toString()))
      .map((id) => id.toString());

    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Invalid bookVariantId: ${missingIds.join(', ')}`,
      );
    }

    await db.purchaseOrderItem.createMany({
      data: items.map((item) => ({
        purchaseOrderId,
        bookVariantId: BigInt(item.bookVariantId),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    });

    return db.purchaseOrderItem.findMany({
      where: { purchaseOrderId },
      select: purchaseOrderItemSelect,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  private getDb(tx?: DbClient): any {
    return (tx ?? this.prisma) as any;
  }

  private toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
  }
}
