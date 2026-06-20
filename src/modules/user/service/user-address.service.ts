import { Injectable } from '@nestjs/common';
import { CreateUserAddressRequestDto } from '../dto/request/create-user-address.request.dto';
import { UpdateUserAddressRequestDto } from '../dto/request/update-user-address.request.dto';
import { UserAddressRepository } from '../repository/user-address.repository';

@Injectable()
export class UserAddressService {
    constructor(private readonly userAddressRepository: UserAddressRepository) { }

    getUserAddressByUserId(userId: number) {
        return this.userAddressRepository.getUserAddressByUserId(userId);
    }

    createUserAddressByUserId(userId: number, body: CreateUserAddressRequestDto) {
        return this.userAddressRepository.createUserAddressByUserId(userId, body);
    }

    updateUserAddressByIdAndUserId(id: number, userId: number, body: UpdateUserAddressRequestDto) {
        return this.userAddressRepository.updateUserAddressByIdAndUserId(id, userId, body);
    }

    setDefaultByIdAndUserId(id: number, userId: number) {
        return this.userAddressRepository.setDefaultByIdAndUserId(id, userId);
    }

    softDeleteByIdAndUserId(id: number, userId: number) {
        return this.userAddressRepository.softDeleteByIdAndUserId(id, userId);
    }
}
