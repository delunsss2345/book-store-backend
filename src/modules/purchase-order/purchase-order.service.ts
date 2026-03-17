import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrdersQueryDto,
} from './dto';
import { PurchaseOrderRepository } from './purchase-order.repository';

type PurchaseOrderDetailRow = NonNullable<
  Awaited<ReturnType<PurchaseOrderRepository['findPurchaseOrderById']>>
>;

type PurchaseOrderItemRow = PurchaseOrderDetailRow['items'][number];

export type PurchaseOrderCreateResponse = {
  id: string;
  supplierId: string;
  code: string;
  status: string;
  note: string | null;
  totalAmount: number;
  taxAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    purchaseOrderId: string;
    bookVariantId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) { }

  async createPurchaseOrder(
    createdById: bigint,
    body: CreatePurchaseOrderRequestDto,
  ): Promise<PurchaseOrderCreateResponse> {
    const createdOrder = await this.purchaseOrderRepository.withTransaction(
      async (tx) => {
        const purchaseOrder =
          await this.purchaseOrderRepository.createPurchaseOrder(
            createdById,
            body,
            tx,
          );

        await this.purchaseOrderRepository.createPurchaseOrderItems(
          purchaseOrder.id,
          body.items ?? [],
          tx,
        );

        return this.purchaseOrderRepository.findPurchaseOrderById(
          purchaseOrder.id,
          tx,
        );
      },
    );

    if (!createdOrder) {
      throw new Error('Created purchase order could not be loaded');
    }

    return this.toPurchaseOrderCreateResponse(createdOrder);
  }

  async getPurchaseOrders(query: GetPurchaseOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [total, items] = await Promise.all([
      this.purchaseOrderRepository.findCountPurchaseOrders(),
      this.purchaseOrderRepository.findPurchaseOrders({
        page,
        limit,
      }),
    ]);

    return buildPaginatedResult(items, total, page, limit)
  }

  getPurchaseOrderDetail(purchaseOrderId: string) {
    throw new Error('Method not implemented.');
  }

  approvePurchaseOrder(
    purchaseOrderId: string,
    approvedById: bigint,
    body?: ApprovePurchaseOrderRequestDto,
  ) {
    throw new Error('Method not implemented.');
  }

  private toPurchaseOrderCreateResponse(
    row: PurchaseOrderDetailRow,
  ): PurchaseOrderCreateResponse {
    return {
      id: row.id,
      supplierId: row.supplierId.toString(),
      code: row.code,
      status: row.status,
      note: row.note ?? null,
      totalAmount: this.toDecimalNumber(row.totalAmount),
      taxAmount: this.toDecimalNumber(row.taxAmount),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      items: row.items.map((item) => this.toPurchaseOrderItem(item)),
    };
  }

  private toPurchaseOrderItem(
    row: PurchaseOrderItemRow,
  ): PurchaseOrderCreateResponse['items'][number] {
    return {
      id: row.id,
      purchaseOrderId: row.purchaseOrderId,
      bookVariantId: row.bookVariantId.toString(),
      quantity: row.quantity,
      unitPrice: this.toDecimalNumber(row.unitPrice),
      totalPrice: this.toDecimalNumber(row.totalPrice),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private toDecimalNumber(value: Prisma.Decimal | number): number {
    return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  }
}
