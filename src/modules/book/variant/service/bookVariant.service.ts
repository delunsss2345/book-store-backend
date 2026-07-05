import { PrismaClientTransaction } from '@/database';
import { CheckoutItemDto } from '@/modules/order/dto/request/create-orders.dto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BookVariantRepository } from '../repository/bookVariant.repository';

@Injectable()
export class BookVariantService {
  constructor(private readonly bookVariantRepository: BookVariantRepository) { }
  findByVariantIds(variantIds: number[]) {
    return this.bookVariantRepository.findByIds(variantIds);
  }
  async applyStockImport(
    params: {
      bookVariantId: number;
      quantity: number;
      costPrice: number;
    },
    tx?: Prisma.TransactionClient,
  ) {

    const bookVariant =
      await this.bookVariantRepository.findBookVariantInventoryById(
        params.bookVariantId,
        tx,
      );

    if (!bookVariant) {
      return;
    }

    const nextStock = (bookVariant.stock ?? 0) + params.quantity;
    const currentPrice = this.toDecimalNumber(bookVariant.price);

    await this.bookVariantRepository.updateBookVariantInventory(
      {
        bookVariantId: params.bookVariantId,
        stock: nextStock,
        price: currentPrice
      },
      tx,
    );
  }

  updateReservedById(id: number, quantity: number, tx: PrismaClientTransaction) {
    return this.bookVariantRepository.updateReservedById(id, quantity, tx);
  }

  updateReservedByIds(payload: CheckoutItemDto[], tx?: PrismaClientTransaction) {
    return this.bookVariantRepository.updateReservedByIds(payload, tx);
  }

  private toDecimalNumber(value: Prisma.Decimal | number | null | undefined) {
    if (value == null) {
      return 0;
    }

    return value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  }
}
