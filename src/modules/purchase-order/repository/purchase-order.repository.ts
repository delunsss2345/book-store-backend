import { PurchaseOrderMessage } from '@/common';
import { PrismaService } from '@/database';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PurchaseOrderStatus } from '@prisma/client';
import {
  CreatePurchaseOrderItemRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrdersQueryDto,
} from '../dto';
import {
  buildPurchaseOrderItemWithBookVariantSelect,
  purchaseOrderDetailSelect,
  purchaseOrderItemSelect,
  purchaseOrderListSelect,
  purchaseOrderSummarySelect,
} from '../select';

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaService) { }

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
      throw new BadRequestException(PurchaseOrderMessage.INVALID_SUPPLIER);
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
      select: purchaseOrderSummarySelect,
    });
  }

  findPurchaseOrders(query: GetPurchaseOrdersQueryDto) {
    return this.prisma.purchaseOrder.findMany({
      take: query.limit ?? 20,
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 0),
      select: purchaseOrderListSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  findCountPurchaseOrders() {
    return this.prisma.purchaseOrder.count();
  }

  findCountPurchaseOrderItems(purchaseOrderId: string) {
    return this.prisma.purchaseOrderItem.count({
      where: { purchaseOrderId },
    });
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

  findPurchaseOrderItemsByPurchaseOrderId(params: {
    purchaseOrderId: string;
    languageId: number;
    limit: number;
    offset: number;
  }) {
    const { purchaseOrderId, languageId, limit, offset } = params;

    return this.prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId },
      take: limit,
      skip: offset,
      select: buildPurchaseOrderItemWithBookVariantSelect(languageId),
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  updatePurchaseOrderStatus(
    purchaseOrderId: string,
    approvedById: bigint,
    status: PurchaseOrderStatus,
    tx?: DbClient,
  ) {
    const db = this.getDb(tx);

    return db.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status,
        approvedById,
        approvedAt: new Date(),
      },
    });
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
    const bookVariantIds = [
      ...new Set(items.map((item) => BigInt(item.bookVariantId))),
    ];
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
        PurchaseOrderMessage.INVALID_BOOK_VARIANT_IDS(missingIds),
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
