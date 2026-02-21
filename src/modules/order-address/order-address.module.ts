import { Module } from '@nestjs/common';
import { OrderAddressRepository } from './order-address.repository';

@Module({
    providers: [OrderAddressRepository],
    exports: [OrderAddressRepository],
})
export class OrderAddressModule { }
