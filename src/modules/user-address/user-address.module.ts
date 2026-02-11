import { Module } from '@nestjs/common';
import { UserAddressController } from './user-address.controller';
import { UserAddressRepository } from './user-address.repository';
import { UserAddressService } from './user-address.service';

@Module({
    controllers: [UserAddressController],
    providers: [UserAddressService, UserAddressRepository],
    exports: [UserAddressService],
})
export class UserAddressModule { }
