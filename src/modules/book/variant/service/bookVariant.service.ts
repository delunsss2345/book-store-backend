import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BookVariantRepository } from '../repository/bookVariant.repository';

@Injectable()
export class BookVariantService {
  constructor(private readonly bookVariantRepository: BookVariantRepository) {}

  async applyStockImport(
    params: {
      bookVariantId: number;
      quantity: number;
      costPrice: number;
    },
    tx?: Prisma.TransactionClient,
  ) {
    // Chi xu ly tiep khi variant ton tai, neu khong thi bo qua theo nghiep vu.
    const bookVariant =
      await this.bookVariantRepository.findBookVariantInventoryById(
        params.bookVariantId,
        tx,
      );

    if (!bookVariant) {
      return;
    }

    const nextStock = (bookVariant.stock ?? 0) + params.quantity;
    const nextCostPrice = params.costPrice;
    const currentPrice = this.toDecimalNumber(bookVariant.price);

    // Tu dong nang gia ban neu gia hien tai nho hon gia von moi.
    await this.bookVariantRepository.updateBookVariantInventory(
      {
        bookVariantId: params.bookVariantId,
        stock: nextStock,
        costPrice: nextCostPrice,
        ...(currentPrice < nextCostPrice
          ? { price: nextCostPrice + 50000 }
          : {}),
      },
      tx,
    );
  }

  private toDecimalNumber(value: Prisma.Decimal | number | null | undefined) {
    if (value == null) {
      return 0;
    }

    return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  }
}
