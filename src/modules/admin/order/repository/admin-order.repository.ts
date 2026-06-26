import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import {
  guestOrderListSelect,
  orderDetailSelect,
  orderStatusCheckSelect,
  userOrderListSelect,
} from '../select';

@Injectable()
export class AdminOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  countGuestOrders() {
    return this.prisma.order.count({
      where: {
        userId: null,
      },
    });
  }

  countUserOrders() {
    return this.prisma.order.count({
      where: {
        userId: {
          not: null,
        },
      },
    });
  }

  findGuestOrders(page: number, limit: number) {
    return this.prisma.order.findMany({
      where: {
        userId: null,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: guestOrderListSelect,
    });
  }

  findUserOrders(page: number, limit: number) {
    return this.prisma.order.findMany({
      where: {
        userId: {
          not: null,
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: userOrderListSelect,
    });
  }

  findOrderDetailById(orderId: number) {
    return this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: orderDetailSelect,
    });
  }

  findOrderStatusById(orderId: number) {
    return this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: orderStatusCheckSelect,
    });
  }

  updateOrderStatus(orderId: number, status: OrderStatus, note: string | null) {
    return this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
        note,
      },
      select: {
        id: true,
      },
    });
  }
}
