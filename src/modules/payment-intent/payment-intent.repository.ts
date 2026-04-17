import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentGateway, PaymentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/database';

export type CreatePaymentIntentParams = {
  orderId: bigint;
  gateway: PaymentGateway;
  orderCode: string;
  status?: PaymentStatus;
  expiredAt: Date;
  tokenUrl: string;
};

@Injectable()
export class PaymentIntentRepository {
  constructor(private readonly prisma: PrismaService) { }

  create(
    params: CreatePaymentIntentParams,
  ) {
    return this.prisma.paymentIntent.create({
      data: {
        orderId: params.orderId,
        gateway: params.gateway,
        orderCode: params.orderCode,
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