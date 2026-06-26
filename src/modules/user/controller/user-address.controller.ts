import type { JwtPayload } from '@/common';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateUserAddressRequestDto } from '../dto/request/create-user-address.request.dto';
import { UpdateUserAddressRequestDto } from '../dto/request/update-user-address.request.dto';
import { UserAddressService } from '../service/user-address.service';

@ApiTags('user-address')
@Controller('user-address')
export class UserAddressController {
    constructor(private readonly userAddressService: UserAddressService) { }

    @ApiOperation({ summary: 'Get all addresses for the authenticated user' })
    @ApiOkResponse({ description: 'List of user addresses', type: Object })
    @ApiBearerAuth('access-token')
    @Get('user')
    getUserAddressByUserId(@GetUser() user: JwtPayload) {
        const parsedUserId = Number(user.sub);
        return this.userAddressService.getUserAddressByUserId(parsedUserId);
    }

    @ApiOperation({ summary: 'Create a new address for the authenticated user' })
    @ApiCreatedResponse({ description: 'Address created successfully', type: Object })
    @ApiBearerAuth('access-token')
    @Post('user')
    createUserAddressByUserId(
        @GetUser() user: JwtPayload,
        @Body() body: CreateUserAddressRequestDto,
    ) {
        const parsedUserId = Number(user.sub);
        return this.userAddressService.createUserAddressByUserId(parsedUserId, body);
    }

    @ApiOperation({ summary: 'Update an address by ID for the authenticated user' })
    @ApiOkResponse({ description: 'Address updated successfully', type: Object })
    @ApiParam({ name: 'id', type: Number, description: 'Address ID' })
    @ApiBearerAuth('access-token')
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

    @ApiOperation({ summary: 'Set an address as the default for the authenticated user' })
    @ApiOkResponse({ description: 'Default address updated successfully', type: Object })
    @ApiParam({ name: 'id', type: Number, description: 'Address ID' })
    @ApiBearerAuth('access-token')
    @Patch('user/:id/set-default')
    setDefaultByIdAndUserId(@Param('id') id: string, @GetUser() user: JwtPayload) {
        console.log('id')
        const parsedId = Number(id);
        const parsedUserId = Number(user.sub);
        return this.userAddressService.setDefaultByIdAndUserId(parsedId, parsedUserId);
    }

    @ApiOperation({ summary: 'Soft-delete an address by ID for the authenticated user' })
    @ApiOkResponse({ description: 'Address deleted successfully', type: Object })
    @ApiParam({ name: 'id', type: Number, description: 'Address ID' })
    @ApiBearerAuth('access-token')
    @Delete('user/:id')
    softDeleteByIdAndUserId(@Param('id') id: string, @GetUser() user: JwtPayload) {
        const parsedId = Number(id);
        const parsedUserId = Number(user.sub);
        return this.userAddressService.softDeleteByIdAndUserId(parsedId, parsedUserId);
    }
}
