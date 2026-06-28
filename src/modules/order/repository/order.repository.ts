import { SHIPPING_FEE } from '@/common';
import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
import { PrismaClientTransaction, PrismaService } from '@/database';
import { generateOrderCode } from '@/utils/generateOrderCode.util';
import { Injectable, Logger } from '@nestjs/common';
import {
  CurrencyCode,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

export type OrderByUserRow = {
  quantity: number;
  bookVariantSnapshotId: number | null;
  bookVariantId: number | null;
  bookId: number | null;
};

export type OrderWithItemsRow = {
  id: number;
  items: {
    id: number;
    bookVariantSnapshotId: number | null;
    quantity: number;
    createdAt: Date;
  }[];
};

const orderListSelect = Prisma.validator<Prisma.OrderSelect>()({
  orderCode: true,
  status: true,
  subtotal: true,
  discountAmount: true,
  shippingFee: true,
  totalAmount: true,
  placedAt: true,
  createdAt: true,
});

export type OrderListRow = Prisma.OrderGetPayload<{
  select: typeof orderListSelect;
}>;

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) { }

  async deleteById(orderId: number) {
    return this.prisma.order.delete({
      where: {
        id: orderId
      }
    })
  }

  async findOrderItemsByOrderId(
    orderIds: number[],
  ): Promise<OrderWithItemsRow[]> {
    if (!orderIds.length) {
      return [];
    }

    return this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            bookVariantSnapshotId: true,
            quantity: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async updateStatusByOrderId(orderId: number, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async findOrderItemWWithParentVariantByOrderId(
    orderId: number,
    tx?: PrismaClientTransaction,
  ) {
    const db = tx ?? this.prisma;
    return db.order.findFirst({
      where: { id: orderId },
      select: {
        id: true,
        items: {
          select: {
            id: true,
            bookVariantSnapshot: {
              select: {
                bookVariant: {
                  select: {
                    id: true,
                  },
                },
              },
            },
            quantity: true,
            createdAt: true,
          },
        },
      },
    });
  }

  createOrdersByUserId(userId: number) {
    const orderCode = generateOrderCode();
    return this.prisma.order.create({
      data: {
        userId: userId,
        orderCode: orderCode,
        paymentStatus: PaymentStatus.PENDING,
        shippingFee: SHIPPING_FEE,
        expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
      },
    });
  }

  upsertOrdersByGuestId(
    guestId: string,
    idempotencyKey: string,
    totalAmount: number,
  ) {
    const orderCode = generateOrderCode();
    return this.prisma.order.upsert({
      where: { idempotencyKey },
      create: {
        idempotencyKey,
        totalAmount,
        guestSessionId: guestId,
        orderCode: orderCode,
        paymentStatus: PaymentStatus.PENDING,
        shippingFee: SHIPPING_FEE,
        expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
      },
      update: {},
    });
  }

  findOrderBySessionGuestId(guestId: string, page: number, limit: number) {
    return this.prisma.order.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: { guestSessionId: guestId },
      orderBy: { createdAt: 'desc' },
      select: orderListSelect,
    });
  }

  findOrderByUserId(userId: number, page: number, limit: number) {
    return this.prisma.order.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      select: orderListSelect,
    });
  }

  findOrderDetailByUserId(userId: number, page: number, limit: number) {
    return this.prisma.order.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        items: true,
      },
    });
  }

  findOrderIsExpire(orderSecondMinutes: number) {
    Logger.debug(
      `Tìm kiếm order đã hết hạn trước ${orderSecondMinutes} giây`,
      'OrderRepository',
    );
    return this.prisma.order.findMany({
      where: {
        expiredAt: { lt: new Date(Date.now() + orderSecondMinutes * 1000) },
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
      },
      select: {
        items: {
          select: {
            quantity: true,
            bookVariantSnapshot: {
              select: {
                bookVariantId: true,
              },
            },
          },
        },
      },
    });
  }

  clearOrder(variantMap: Map<string, number>, orderSecondMinutes: number) {
    return this.prisma.$transaction(async (tx) => {
      for (const [key, value] of variantMap) {
        await tx.bookVariant.updateMany({
          where: { id: Number(key) },
          data: {
            stock: { increment: value },
            reserved: { decrement: value },
          },
        });
      }
      await tx.order.updateMany({
        where: {
          expiredAt: { lt: new Date(Date.now() + orderSecondMinutes * 1000) },
        },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.EXPIRED,
        },
      });
    });
  }

  updateOrderDone(
    variantMap: Map<string, number>,
    orderId: number,
    tx?: PrismaClientTransaction,
  ) {
    const updateOrderAndVariant = async (db: PrismaClientTransaction) => {
      for (const [key, value] of variantMap) {
        await db.bookVariant.updateMany({
          where: { id: Number(key) },
          data: {
            stock: { decrement: value },
            reserved: { decrement: value },
          },
        });
      }
      await db.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
        },
      });
    };

    if (tx) {
      return updateOrderAndVariant(tx);
    }

    return this.prisma.$transaction(async (prismaTx) => {
      return updateOrderAndVariant(prismaTx);
    });
  }

  findByCartHash(cartHash: string, tx: PrismaClientTransaction) {
    return tx.order.findFirst({
      where: { cartHash },
      include: {
        payments: {
          where: { status: PaymentStatus.PENDING },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  findOrderNotSuccessByCartHash(cartHash: string, tx: PrismaClientTransaction) {
    return tx.order.findFirst({
      where: { cartHash },
      include: {
        payments: {
          where: {
            status: {
              in: [
                PaymentStatus.PENDING,
                PaymentStatus.PAYMENT_OVERAGE,
                PaymentStatus.PAYMENT_SHORTFALL,
              ],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  create(data: Prisma.OrderUncheckedCreateInput, tx: PrismaClientTransaction = this.prisma) {
    return tx.order.create({ data });
  }

  createWithGuest(
    data: {
      guestSessionId: string;
      cartHash: string;
      orderCode: string;
      status: OrderStatus;
      paymentStatus: PaymentStatus;
      currencyCode: CurrencyCode;
      shippingFee: number;
      expiredAt: Date;
    },
    tx: PrismaClientTransaction,
  ) {
    return tx.order.create({ data });
  }

  updateById(
    id: number,
    data: Prisma.OrderUncheckedUpdateInput,
    tx: PrismaClientTransaction,
  ) {
    return tx.order.update({ where: { id }, data });
  }
}
