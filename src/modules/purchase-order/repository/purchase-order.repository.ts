import { PurchaseOrderMessage } from '@/common';
import { PrismaService } from '@/database';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PurchaseOrderStatus } from '@prisma/client';
import {
  GetPurchaseOrdersQueryDto,
} from '../dto';
import {
  buildPurchaseOrderItemWithBookVariantSelect,
  purchaseOrderDetailSelect,
  purchaseOrderListSelect,
  purchaseOrderSummarySelect,
} from '../select';

type DbClient = Prisma.TransactionClient | PrismaService;

export type CreatePurchaseOrderInput = {
  code: string;
  supplierId: number;
  createdById: number;
  note?: string;
  taxAmount: number;
  totalAmount: number;
  createdAt?: string | Date;
};

@Injectable()
export class PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaService) { }

  async createPurchaseOrder(
    input: CreatePurchaseOrderInput,
    tx: DbClient = this.prisma,
  ) {
    const supplier = await tx.supplier.findUnique({
      where: { id: input.supplierId },
      select: { id: true },
    });

    if (!supplier) {
      throw new BadRequestException(PurchaseOrderMessage.INVALID_SUPPLIER);
    }

    return tx.purchaseOrder.create({
      data: {
        supplierId: input.supplierId,
        code: input.code,
        createdById: input.createdById,
        ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
        note: input.note,
        totalAmount: input.totalAmount,
        taxAmount: input.taxAmount,
      },
      select: purchaseOrderSummarySelect,
    });
  }

  findBookVariantsByIdsAndBookId(
    variantIds: number[],
    bookId: number,
    tx: DbClient = this.prisma,
  ) {
    return tx.bookVariant.findMany({
      where: {
        id: { in: variantIds },
        bookId,
      },
      select: { id: true },
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

  findPurchaseOrderById(purchaseOrderId: string, tx: DbClient = this.prisma) {
    return tx.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      select: purchaseOrderDetailSelect,
    });
  }

  findPurchaseOrderByCode(code: string, tx: DbClient = this.prisma) {
    return tx.purchaseOrder.findUnique({
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
    approvedById: number,
    status: PurchaseOrderStatus,
    tx: DbClient = this.prisma,
  ) {
    return tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: {
        status,
        approvedById,
        approvedAt: new Date(),
      },
    });
  }
}
