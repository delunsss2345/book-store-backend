import { PrismaClientTransaction } from '@/database';
import { CreateOrderAddressDTO } from '@/modules/order/dto/request/create-order-address.dto';
import { Injectable } from '@nestjs/common';
import { OrderAddressRepository } from '../repository/order-address.repository';

@Injectable()
export class OrderAddressService {
  constructor(private readonly orderAddressRepository: OrderAddressRepository) {}

  createWithGuest(orderId: number, body: CreateOrderAddressDTO, note: string | undefined, tx: PrismaClientTransaction) {
    return this.orderAddressRepository.createGuestAddressInTx(orderId, body, note, tx);
  }
}
