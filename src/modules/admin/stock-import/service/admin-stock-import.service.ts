import { StockImportItemMessage } from '@/common';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { PurchaseOrderService } from '@/modules/admin/purchase-order/service/purchase-order.service';
import { TransactionService } from '@/modules/transaction/service/transaction.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PurchaseOrderType } from '@prisma/client';
import { AdminStockImportListQueryDto, CreateAdminStockImportRequestDto } from '../dto/request';
import {
  AdminStockImportDetailResponseDto,
  AdminStockImportListResponseDto,
} from '../dto/response';
import { toAdminStockImportDetail, toAdminStockImportItem } from '../mapper';
import { AdminStockImportRepository } from '../repository/admin-stock-import.repository';

function toDecimalNumber(value: Prisma.Decimal | number): number {
  return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
}

@Injectable()
export class AdminStockImportService {
  constructor(
    private readonly adminStockImportRepository: AdminStockImportRepository,
    private readonly adminPurchaseService: PurchaseOrderService,
    private readonly transactionService: TransactionService,
  ) { }

  async getStockImports(
    query: AdminStockImportListQueryDto,
  ): Promise<AdminStockImportListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.adminStockImportRepository.countStockImports(),
      this.adminStockImportRepository.findStockImports(page, limit),
    ]);

    return buildPaginatedResult(
      rows.map((row) => toAdminStockImportItem(row)),
      total,
      page,
      limit,
    );
  }

  async getStockImportDetail(
    purchaseOrderId: string,
  ): Promise<AdminStockImportDetailResponseDto> {
    const row =
      await this.adminStockImportRepository.findStockImportById(purchaseOrderId);

    if (!row) {
      throw new NotFoundException(
        StockImportItemMessage.STOCK_IMPORT_NOT_FOUND,
      );
    }

    return toAdminStockImportDetail(row);
  }

  async createStockImport(
    createdById: number,
    body: CreateAdminStockImportRequestDto,
  ): Promise<AdminStockImportDetailResponseDto> {
    const poItems =
      await this.adminStockImportRepository.findPurchaseOrderItemsByIds(
        body.items.map((i) => i.purchaseOrderItemId),
      );

    const poItemMap = new Map(poItems.map((i) => [i.id, i]));
    let purchasePrice = 0;
    const itemsWithPrices = body.items.map((item) => {
      const poItem = poItemMap.get(item.purchaseOrderItemId);
      if (!poItem) {
        throw new NotFoundException(
          `Purchase order item ${item.purchaseOrderItemId} not found`,
        );
      }
      const price = toDecimalNumber(poItem.price);
      purchasePrice += price;
      const lackQuantity = poItem.quantity - item.realQuantity;
      const totalPrice = item.realQuantity * price - lackQuantity * price;
      return {
        purchaseOrderItemId: item.purchaseOrderItemId,
        realQuantity: item.realQuantity,
        lackQuantity,
        totalPrice,
      };
    });

    const totalAmount = itemsWithPrices.reduce(
      (sum, i) => sum + i.totalPrice,
      0,
    );

    const created = await this.transactionService.doInTransaction(async (tx) => {
      const si = await this.adminStockImportRepository.createStockImport(
        {
          purchaseOrderId: body.purchaseOrderId,
          createdBy: createdById,
          note: body.note,
          totalAmount,
        },
        tx,
      );
      const total = Number(totalAmount);
      const purchase = Number(purchasePrice);

      const realPayPrice =
        total > purchase
          ? total
          : purchase > total
            ? purchase - Math.abs(total)
            : purchase;
      
      await Promise.all([
        this.adminStockImportRepository.createStockImportItems(
          si.id,
          itemsWithPrices,
          tx,
        ),
        this.adminPurchaseService.updateStatusTransferWithChangeProcessing(body.purchaseOrderId, createdById, realPayPrice, PurchaseOrderType.PURCHASE)
      ])
      return this.adminStockImportRepository.findStockImportById(si.id, tx);
    });

    return toAdminStockImportDetail(created!);
  }
}
