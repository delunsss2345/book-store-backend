import { PrismaClientTransaction } from '@/database';
import { Injectable } from '@nestjs/common';
import { OrderItemRepository } from '../repository/order-item.repository';

type CreateOrderItemPayload = {
  orderId: number;
  bookVariantSnapshotId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type CreateOrderItemSnapshotPayload = Omit<CreateOrderItemPayload, 'orderId'>;

@Injectable()
export class OrderItemService {
  constructor(private readonly orderItemRepository: OrderItemRepository) { }

  create(data: CreateOrderItemPayload, tx: PrismaClientTransaction) {
    return this.orderItemRepository.create(data, tx);
  }

  createMany(orderId: number, snapshots: CreateOrderItemSnapshotPayload[], tx: PrismaClientTransaction) {
    return this.orderItemRepository.createMany(orderId, snapshots, tx);
  }
}
