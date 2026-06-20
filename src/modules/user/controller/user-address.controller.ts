import type { JwtPayload } from '@/common';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateUserAddressRequestDto } from '../dto/request/create-user-address.request.dto';
import { UpdateUserAddressRequestDto } from '../dto/request/update-user-address.request.dto';
import { UserAddressService } from '../service/user-address.service';

@Controller('user-address')
export class UserAddressController {
    constructor(private readonly userAddressService: UserAddressService) { }

    @Get('user')
    getUserAddressByUserId(@GetUser() user: JwtPayload) {
        const parsedUserId = Number(user.sub);
        return this.userAddressService.getUserAddressByUserId(parsedUserId);
    }

    @Post('user')
    createUserAddressByUserId(
        @GetUser() user: JwtPayload,
        @Body() body: CreateUserAddressRequestDto,
    ) {
        const parsedUserId = Number(user.sub);
        return this.userAddressService.createUserAddressByUserId(parsedUserId, body);
    }

    @Patch('user/:id')
    updateUserAddressByIdAndUserId(
        @Param('id') id: string,
        @GetUser() user: JwtPayload,
        @Body() body: UpdateUserAddressRequestDto,
    ) {
        const parsedId = Number(id);
        const parsedUserId = Number(user.sub);
        return this.userAddressService.updateUserAddressByIdAndUserId(parsedId, parsedUserId, body);
    }

    @Patch('user/:id/set-default')
    setDefaultByIdAndUserId(@Param('id') id: string, @GetUser() user: JwtPayload) {
        console.log('id')
        const parsedId = Number(id);
        const parsedUserId = Number(user.sub);
        return this.userAddressService.setDefaultByIdAndUserId(parsedId, parsedUserId);
    }

    @Delete('user/:id')
    softDeleteByIdAndUserId(@Param('id') id: string, @GetUser() user: JwtPayload) {
        const parsedId = Number(id);
        const parsedUserId = Number(user.sub);
        return this.userAddressService.softDeleteByIdAndUserId(parsedId, parsedUserId);
    }
}
