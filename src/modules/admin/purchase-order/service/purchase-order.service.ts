import { PurchaseOrderMessage } from '@/common';
import {
  buildPaginatedResult,
  getPaginationParams,
} from '@/common/pagination/base-pagination.util';
import { PrismaClientTransaction } from '@/database';
import { TransactionService } from '@/modules/transaction/service/transaction.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseOrderStatus, PurchaseOrderType } from '@prisma/client';
import {
  ApprovePurchaseOrderRequestDto,
  CreatePurchaseOrderRequestDto,
  GetPurchaseOrderItemsQueryDto,
  GetPurchaseOrdersQueryDto
} from '../dto';
import {
  PurchaseOrderCreateResponse,
  toPurchaseOrderCreateResponse,
  toPurchaseOrderDetailItem
} from '../mapper';
import { PurchaseOrderRepository } from '../repository/purchase-order.repository';

@Injectable()
export class PurchaseOrderService {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly transactionService: TransactionService,
  ) { }

  async createPurchaseOrder(
    createdById: number,
    body: CreatePurchaseOrderRequestDto,
  ): Promise<PurchaseOrderCreateResponse> {
    let totalAmount = 0;
    const itemsWithPrices = body.items.map((item) => {
      const price = item.unitPrice - item.unitPrice * (item.discountPrice / 100);
      const totalPrice = price * item.quantity;
      totalAmount += totalPrice;
      return {
        bookVariantId: item.bookVariantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPrice: item.discountPrice,
        price,
        totalPrice,
      };
    });

    const createdOrder = await this.transactionService.doInTransaction(
      async (tx) => {
        const order = await this.purchaseOrderRepository.createPurchaseOrder(
          {
            code: body.code,
            supplierId: body.supplierId,
            createdById,
            note: body.note,
            totalAmount,
            taxAmount: body.taxAmount ?? 0,
          },
          tx,
        );

        await this.purchaseOrderRepository.createPurchaseOrderItems(
          itemsWithPrices.map((item) => ({ purchaseOrderId: order.id, ...item })),
          tx,
        );

        return this.purchaseOrderRepository.findPurchaseOrderById(order.id, tx);
      },
    );

    if (!createdOrder) {
      throw new Error(PurchaseOrderMessage.UPDATED_PURCHASE_ORDER_COULD_NOT_BE_LOADED);
    }

    return toPurchaseOrderCreateResponse(createdOrder);
  }

  async getPurchaseOrders(query: GetPurchaseOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const [total, items] = await Promise.all([
      this.purchaseOrderRepository.findCountPurchaseOrders(query),
      this.purchaseOrderRepository.findPurchaseOrders({
        page,
        limit,
        status: query.status
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
  ) {
    if (
      body.status !== PurchaseOrderStatus.APPROVED &&
      body.status !== PurchaseOrderStatus.REJECTED
    ) {
      throw new BadRequestException(
        PurchaseOrderMessage.STATUS_MUST_BE_APPROVED_OR_REJECTED,
      );
    }

    const purchaseOrder =
      await this.purchaseOrderRepository.findPurchaseOrderById(
        purchaseOrderId,
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
    );
  }


  async updateStatusTransfer(
    purchaseOrderId: string,
    approvedById: number,
    status: PurchaseOrderType = PurchaseOrderType.PROCESSING
  ) {
    await this.purchaseOrderRepository.updateTransferStatus(
      purchaseOrderId,
      approvedById,
      status
    );
  }

  async updateStatusTransferWithChangeProcessing(
    purchaseOrderId: string,
    approvedById: number,
    realPayPrice: number,
    status: PurchaseOrderType = PurchaseOrderType.PROCESSING,
    tx?: PrismaClientTransaction
  ) {
    await this.purchaseOrderRepository.updateTransferStatus(
      purchaseOrderId,
      approvedById,
      status,
      realPayPrice,
      tx
    );
  }


}
