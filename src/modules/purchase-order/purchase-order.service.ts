import {
  buildPaginatedResult,
  getPaginationParams,
} from '@/common/pagination/base-pagination.util';
import { BookVariantService } from '@/modules/book-variant';
import { StockImportRepository } from '@/modules/stock-import';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PurchaseOrderStatus } from '@prisma/client';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrderItemsQueryDto,
  GetPurchaseOrdersQueryDto
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
    private readonly stockImportRepository: StockImportRepository,
    private readonly bookVariantService: BookVariantService,
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
    langId: number,
  ) {
    const { page, limit, offset } = getPaginationParams(
      query.page ?? 1,
      query.limit ?? 20,
    );
    const purchaseOrder =
      await this.purchaseOrderRepository.findPurchaseOrderById(purchaseOrderId);

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    const [total, items] = await Promise.all([
      this.purchaseOrderRepository.findCountPurchaseOrderItems(purchaseOrderId),
      this.purchaseOrderRepository.findPurchaseOrderItemsByPurchaseOrderId({
        purchaseOrderId,
        languageId: langId,
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

  async approvePurchaseOrder(
    purchaseOrderId: string,
    approvedById: bigint,
    body: ApprovePurchaseOrderRequestDto,
  ): Promise<PurchaseOrderCreateResponse> {
    if (
      body.status !== PurchaseOrderStatus.APPROVED &&
      body.status !== PurchaseOrderStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Purchase order status must be APPROVED or REJECTED',
      );
    }

    const updatedOrder = await this.purchaseOrderRepository.withTransaction(
      async (tx) => {
        // Tai don mua truoc khi cap nhat de chan xu ly lap lai.
        const purchaseOrder =
          await this.purchaseOrderRepository.findPurchaseOrderById(
            purchaseOrderId,
            tx,
          );

        if (!purchaseOrder) {
          throw new NotFoundException('Purchase order not found');
        }

        if (purchaseOrder.status !== PurchaseOrderStatus.PENDING) {
          throw new BadRequestException(
            'Purchase order has already been processed',
          );
        }

        if (!purchaseOrder.items.length) {
          throw new BadRequestException(
            'Purchase order must have at least one item',
          );
        }

        await this.purchaseOrderRepository.updatePurchaseOrderStatus(
          purchaseOrderId,
          approvedById,
          body.status,
          tx,
        );

        if (body.status === PurchaseOrderStatus.APPROVED) {
          // Tao stock import va item tu purchase order trong cung transaction.
          const stockImport =
            await this.stockImportRepository.createStockImportFromPurchaseOrder(
              {
                purchaseOrderId: purchaseOrder.id,
                supplierId: purchaseOrder.supplierId,
                createdById: approvedById,
                note: purchaseOrder.note ?? null,
                totalAmount: this.toDecimalNumber(purchaseOrder.totalAmount),
                taxAmount: this.toDecimalNumber(purchaseOrder.taxAmount),
              },
              tx,
            );

          await this.stockImportRepository.createStockImportItemsFromPurchaseOrder(
            stockImport.id,
            purchaseOrder.items.map((item) => ({
              bookVariantId: item.bookVariantId,
              quantity: item.quantity,
              importPrice: this.toDecimalNumber(item.unitPrice),
            })),
            tx,
          );

          // Sau khi tao stock import item, cap nhat ton kho va gia cua variant.
          for (const item of purchaseOrder.items) {
            await this.bookVariantService.applyStockImport(
              {
                bookVariantId: item.bookVariantId,
                quantity: item.quantity,
                costPrice: this.toDecimalNumber(item.unitPrice),
              },
              tx,
            );
          }
        }

        return this.purchaseOrderRepository.findPurchaseOrderById(
          purchaseOrderId,
          tx,
        );
      },
    );

    if (!updatedOrder) {
      throw new Error('Updated purchase order could not be loaded');
    }

    return this.toPurchaseOrderCreateResponse(updatedOrder);
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
