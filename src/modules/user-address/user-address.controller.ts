import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateUserAddressRequestDto, UpdateUserAddressRequestDto } from './dto/request';
import { UserAddressService } from './user-address.service';

@Controller('user-address')
export class UserAddressController {
    constructor(private readonly userAddressService: UserAddressService) { }

    @Get('user/:userId')
    getUserAddressByUserId(@Param('userId') userId: string) {
        const parsedUserId = parseBigIntRequired(userId, 'userId');
        return this.userAddressService.getUserAddressByUserId(parsedUserId);
    }

    @Post('user/:userId')
    createUserAddressByUserId(
        @Param('userId') userId: string,
        @Body() body: CreateUserAddressRequestDto,
    ) {
        const parsedUserId = parseBigIntRequired(userId, 'userId');
        return this.userAddressService.createUserAddressByUserId(parsedUserId, body);
    }

    @Patch('user/:userId/:id')
    updateUserAddressByIdAndUserId(
        @Param('id') id: string,
        @Param('userId') userId: string,
        @Body() body: UpdateUserAddressRequestDto,
    ) {
        const parsedId = parseBigIntRequired(id, 'id');
        const parsedUserId = parseBigIntRequired(userId, 'userId');
        return this.userAddressService.updateUserAddressByIdAndUserId(parsedId, parsedUserId, body);
    }

    @Patch('user/:userId/:id/set-default')
    setDefaultByIdAndUserId(@Param('id') id: string, @Param('userId') userId: string) {
        const parsedId = parseBigIntRequired(id, 'id');
        const parsedUserId = parseBigIntRequired(userId, 'userId');
        return this.userAddressService.setDefaultByIdAndUserId(parsedId, parsedUserId);
    }

    @Delete('user/:userId/:id')
    softDeleteByIdAndUserId(@Param('id') id: string, @Param('userId') userId: string) {
        const parsedId = parseBigIntRequired(id, 'id');
        const parsedUserId = parseBigIntRequired(userId, 'userId');
        return this.userAddressService.softDeleteByIdAndUserId(parsedId, parsedUserId);
    }
}
