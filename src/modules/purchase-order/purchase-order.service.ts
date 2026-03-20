import {
  buildPaginatedResult,
  getPaginationParams,
} from '@/common/pagination/base-pagination.util';
import { LanguageService } from '@/modules/language/language.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrderItemsQueryDto,
  GetPurchaseOrdersQueryDto,
} from './dto';
import { PurchaseOrderRepository } from './purchase-order.repository';

type PurchaseOrderDetailRow = NonNullable<
  Awaited<ReturnType<PurchaseOrderRepository['findPurchaseOrderById']>>
>;

type PurchaseOrderItemRow = PurchaseOrderDetailRow['items'][number];
type PurchaseOrderDetailItemRow = Awaited<
  ReturnType<PurchaseOrderRepository['findPurchaseOrderItemsByPurchaseOrderId']>
>[number];

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

export type PurchaseOrderDetailItemResponse = {
  id: string;
  purchaseOrderId: string;
  bookVariantId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  title: string | null;
  format: string;
};

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly languageService: LanguageService,
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

  async getPurchaseOrderDetail(
    purchaseOrderId: string,
    query: GetPurchaseOrderItemsQueryDto,
    lang: string,
  ) {
    const { page, limit, offset } = getPaginationParams(
      query.page ?? 1,
      query.limit ?? 20,
    );
    const language = await this.languageService.resolveLanguage(lang);
    const purchaseOrder =
      await this.purchaseOrderRepository.findPurchaseOrderById(purchaseOrderId);

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    const [total, items] = await Promise.all([
      this.purchaseOrderRepository.findCountPurchaseOrderItems(purchaseOrderId),
      this.purchaseOrderRepository.findPurchaseOrderItemsByPurchaseOrderId({
        purchaseOrderId,
        languageId: language.id,
        limit,
        offset,
      }),
    ]);

    return buildPaginatedResult(
      items.map((item) => this.toPurchaseOrderDetailItem(item)),
      total,
      page,
      limit,
    );
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

  private toPurchaseOrderDetailItem(
    row: PurchaseOrderDetailItemRow,
  ): PurchaseOrderDetailItemResponse {
    return {
      id: row.id,
      purchaseOrderId: row.purchaseOrderId,
      bookVariantId: row.bookVariantId.toString(),
      quantity: row.quantity,
      unitPrice: this.toDecimalNumber(row.unitPrice),
      totalPrice: this.toDecimalNumber(row.totalPrice),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      title: row.bookVariant.book.translations[0]?.title ?? null,
      format: String(row.bookVariant.format),
    };
  }

  private toDecimalNumber(value: Prisma.Decimal | number): number {
    return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  }
}
