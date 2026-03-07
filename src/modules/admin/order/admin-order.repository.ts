import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  countOrders() {
    return this.prisma.order.count();
  }

  findOrders(page: number, limit: number) {
    return this.prisma.order.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        orderCode: true,
        userId: true,
        guestSessionId: true,
        guestEmail: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        discountAmount: true,
        shippingFee: true,
        totalAmount: true,
        currencyCode: true,
        placedAt: true,
        createdAt: true,
        expiredAt: true,
        updatedAt: true,
      },
    });
  }

  findOrderDetailById(orderId: bigint) {
    return this.prisma.order.findFirst({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        orderCode: true,
        userId: true,
        guestSessionId: true,
        guestEmail: true,
        status: true,
        paymentStatus: true,
        subtotal: true,
        discountAmount: true,
        shippingFee: true,
        totalAmount: true,
        currencyCode: true,
        placedAt: true,
        createdAt: true,
        expiredAt: true,
        updatedAt: true,
        items: {
          orderBy: [{ id: 'asc' }],
          select: {
            id: true,
            bookVariantSnapshotId: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
            createdAt: true,
            bookVariantSnapshot: {
              select: {
                titleSnapshot: true,
                coverImageUrlSnapshot: true,
                skuSnapshot: true,
                priceSnapshot: true,
                currencyCodeSnapshot: true,
                formatSnapshot: true,
                editionSnapshot: true,
                isbnSnapshot: true,
              },
            },
          },
        },
      },
    });
  }
}
