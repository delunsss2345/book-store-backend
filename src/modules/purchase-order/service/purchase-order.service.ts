import { PurchaseOrderMessage } from '@/common';
import {
  buildPaginatedResult,
  getPaginationParams,
} from '@/common/pagination/base-pagination.util';
import { BookVariantService } from '@/modules/book/variant';
import { StockImportService } from '@/modules/stock-import/service/stock-import.service';
import { TransactionService } from '@/modules/transaction/service/transaction.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseOrderStatus } from '@prisma/client';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrderItemsQueryDto,
  GetPurchaseOrdersQueryDto,
} from '../dto';
import {
  PurchaseOrderCreateResponse,
  toDecimalNumber,
  toPurchaseOrderCreateResponse,
  toPurchaseOrderDetailItem
} from '../mapper';
import { PurchaseOrderRepository } from '../repository/purchase-order.repository';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly stockImportService: StockImportService,
    private readonly bookVariantService: BookVariantService,
    private readonly transactionService: TransactionService,
  ) { }

  async createPurchaseOrder(
    createdById: number,
    body: CreatePurchaseOrderRequestDto,
  ): Promise<PurchaseOrderCreateResponse> {
    const createdOrder = await this.transactionService.doInTransaction(
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
      throw new Error(
        PurchaseOrderMessage.CREATED_PURCHASE_ORDER_COULD_NOT_BE_LOADED,
      );
    }

    return toPurchaseOrderCreateResponse(createdOrder);
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

    return buildPaginatedResult(items, total, page, limit);
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
      throw new NotFoundException(
        PurchaseOrderMessage.PURCHASE_ORDER_NOT_FOUND,
      );
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
      items.map((item) => toPurchaseOrderDetailItem(item)),
      total,
      page,
      limit,
    );
  }

  async approvePurchaseOrder(
    purchaseOrderId: string,
    approvedById: number,
    body: ApprovePurchaseOrderRequestDto,
  ): Promise<PurchaseOrderCreateResponse> {
    if (
      body.status !== PurchaseOrderStatus.APPROVED &&
      body.status !== PurchaseOrderStatus.REJECTED
    ) {
      throw new BadRequestException(
        PurchaseOrderMessage.STATUS_MUST_BE_APPROVED_OR_REJECTED,
      );
    }

    const updatedOrder = await this.transactionService.doInTransaction(
      async (tx) => {
        // Tai don mua truoc khi cap nhat de chan xu ly lap lai.
        const purchaseOrder =
          await this.purchaseOrderRepository.findPurchaseOrderById(
            purchaseOrderId,
            tx,
          );

        if (!purchaseOrder) {
          throw new NotFoundException(
            PurchaseOrderMessage.PURCHASE_ORDER_NOT_FOUND,
          );
        }

        if (purchaseOrder.status !== PurchaseOrderStatus.PENDING) {
          throw new BadRequestException(
            PurchaseOrderMessage.PURCHASE_ORDER_HAS_ALREADY_BEEN_PROCESSED,
          );
        }

        if (!purchaseOrder.items.length) {
          throw new BadRequestException(
            PurchaseOrderMessage.PURCHASE_ORDER_MUST_HAVE_AT_LEAST_ONE_ITEM,
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
            await this.stockImportService.createStockImportFromPurchaseOrder(
              {
                purchaseOrderId: purchaseOrder.id,
                supplierId: purchaseOrder.supplierId,
                createdById: approvedById,
                note: purchaseOrder.note ?? null,
                totalAmount: toDecimalNumber(purchaseOrder.totalAmount),
                taxAmount: toDecimalNumber(purchaseOrder.taxAmount),
              },
              tx,
            );

          await this.stockImportService.createStockImportItemsFromPurchaseOrder(
            stockImport.id,
            purchaseOrder.items.map((item) => ({
              bookVariantId: item.bookVariantId,
              quantity: item.quantity,
              importPrice: toDecimalNumber(item.unitPrice),
            })),
            tx,
          );

          // Sau khi tao stock import item, cap nhat ton kho va gia cua variant.
          for (const item of purchaseOrder.items) {
            await this.bookVariantService.applyStockImport(
              {
                bookVariantId: item.bookVariantId,
                quantity: item.quantity,
                costPrice: toDecimalNumber(item.unitPrice),
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
      throw new Error(
        PurchaseOrderMessage.UPDATED_PURCHASE_ORDER_COULD_NOT_BE_LOADED,
      );
    }

    return toPurchaseOrderCreateResponse(updatedOrder);
  }
}
