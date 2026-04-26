import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentGateway, PaymentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/database';

export type CreatePaymentIntentParams = {
  orderId: bigint;
  gateway: PaymentGateway;
  orderCode: string;
  content?: string;
  status?: PaymentStatus;
  paymentUrl: string;
  expiredAt: Date;
  tokenUrl: string;
};

@Injectable()
export class PaymentIntentRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByOrderCode(orderCode: string) {
    return this.prisma.paymentIntent.findFirst({
      where: {
        orderCode,
      },
      include: {
        order: true,
      },
    });
  }

  findByContent(content: string) {
    return this.prisma.paymentIntent.findFirst({
      where: {
        content,
      },
      include: {
        order: true,
      },
    });
  }

  create(
    params: CreatePaymentIntentParams,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    return db.paymentIntent.create({
      data: {
        orderId: params.orderId,
        gateway: params.gateway,
        paymentUrl: params.paymentUrl,
        orderCode: params.orderCode,
        content: params.content,
        status: params.status ?? PaymentStatus.PENDING,
        tokenUrl: params.tokenUrl,
        expiredAt: params.expiredAt,
      },
    });
  }

  deleteExpiredPending(
    cutoffAt: Date,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.paymentIntent.deleteMany({
      where: {
        expiredAt: { lt: cutoffAt },
        status: PaymentStatus.PENDING,
        order: {
          status: OrderStatus.PENDING_PAYMENT,
        },
      },
    });
  }

  updateStatus(orderId: bigint, status: PaymentStatus) {
    return this.prisma.paymentIntent.updateMany({
      where: {
        orderId,
      },
      data: {
        status,
      },
    });
  }

  findByTokenUrl(tokenUrl: string) {
    return this.prisma.paymentIntent.findUnique({
      where: {
        tokenUrl,
      },
      include: {
        order: true,
      },
    });
  }
}
