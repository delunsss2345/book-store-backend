import { Injectable } from '@nestjs/common';
import { OrderItemRepository } from '@/modules/order-item/order-item.repository';
import { UserEventRepository } from './user-event.repository';

@Injectable()
export class UserEventService {
    constructor(
        private readonly userEventRepository: UserEventRepository,
        private readonly orderItemRepository: OrderItemRepository,
    ) { }

    findEventTypeByUser(userId: bigint) {
        return this.userEventRepository.findEventTypeByUser(userId);
    }

    findOrderItemsByUserId(userId: bigint) {
        return this.orderItemRepository.findByUserId(userId);
    }
}
