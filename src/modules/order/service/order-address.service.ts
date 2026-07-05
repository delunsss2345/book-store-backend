import { PrismaClientTransaction } from '@/database';
import { CreateOrderAddressDTO } from '@/modules/order/dto/request/create-order-address.dto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderAddressRepository } from '../repository/order-address.repository';

@Injectable()
export class OrderAddressService {
  constructor(private readonly orderAddressRepository: OrderAddressRepository) { }

  create(data: Prisma.OrderAddressUncheckedCreateInput, tx?: PrismaClientTransaction) {
    return this.orderAddressRepository.create(data, tx);
  }

  createWithGuest(orderId: number, body: CreateOrderAddressDTO, note: string | undefined, tx: PrismaClientTransaction) {
    return this.orderAddressRepository.createGuestAddressInTx(orderId, body, note, tx);
  }
}
