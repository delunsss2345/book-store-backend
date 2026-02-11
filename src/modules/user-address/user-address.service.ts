import { Injectable } from '@nestjs/common';
import { CreateUserAddressRequestDto, UpdateUserAddressRequestDto } from './dto/request';
import { UserAddressRepository } from './user-address.repository';

@Injectable()
export class UserAddressService {
    constructor(private readonly userAddressRepository: UserAddressRepository) { }

    getUserAddressByUserId(userId: bigint) {
        return this.userAddressRepository.getUserAddressByUserId(userId);
    }

    createUserAddressByUserId(userId: bigint, body: CreateUserAddressRequestDto) {
        return this.userAddressRepository.createUserAddressByUserId(userId, body);
    }

    updateUserAddressByIdAndUserId(id: bigint, userId: bigint, body: UpdateUserAddressRequestDto) {
        return this.userAddressRepository.updateUserAddressByIdAndUserId(id, userId, body);
    }

    setDefaultByIdAndUserId(id: bigint, userId: bigint) {
        return this.userAddressRepository.setDefaultByIdAndUserId(id, userId);
    }

    softDeleteByIdAndUserId(id: bigint, userId: bigint) {
        return this.userAddressRepository.softDeleteByIdAndUserId(id, userId);
    }
}
