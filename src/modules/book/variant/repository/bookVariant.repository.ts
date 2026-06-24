import { PrismaService } from '@/database';
import { CheckoutItemDto } from '@/modules/order/dto/request/create-orders.dto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { bookVariantInventorySelect } from '../select';

type DbClient = Prisma.TransactionClient;

@Injectable()
export class BookVariantRepository {
  constructor(private readonly prisma: PrismaService) { }

  findBookVariantInventoryById(bookVariantId: number, tx: DbClient = this.prisma) {
    return tx.bookVariant.findUnique({
      where: { id: bookVariantId },
      select: bookVariantInventorySelect,
    });
  }


  findByIds(variantIds: number[]) {
    return this.prisma.bookVariant.findMany({
      where: {
        id: {
          in: variantIds
        }
      }
    })
  }

  updateReservedByIds(
    payload: CheckoutItemDto[],
    tx: DbClient = this.prisma,
  ) {
    return tx.$executeRaw`
    UPDATE book_variants SET reserved = reserved + CASE id 
    ${Prisma.join(
      payload.map(p => Prisma.sql`WHEN ${p.bookVariantId} THEN ${p.quantity}`)
    )}
     END
       WHERE id IN (${Prisma.join(payload.map(p => p.bookVariantId))})
      `
  }
  updateBookVariantInventory(
    params: {
      bookVariantId: number;
      stock: number;
      costPrice: number;
      price?: number;
    },
    tx: DbClient = this.prisma,
  ) {

    return tx.bookVariant.update({
      where: { id: params.bookVariantId },
      data: {
        stock: params.stock,
        costPrice: params.costPrice,
        ...(typeof params.price === 'number' ? { price: params.price } : {}),
      },
      select: bookVariantInventorySelect,
    });
  }

  updateReservedById(id: number, quantity: number, tx: DbClient = this.prisma) {
    return tx.bookVariant.update({
      where: { id },
      data: { reserved: { increment: quantity } },
    });
  }


}
