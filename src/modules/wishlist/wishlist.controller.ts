import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { AddWishItemRequestDto } from '@/modules/wishlist/dto/request';
import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { WishlistService } from './wishlist.service';

@ApiTags('wish')
@Public()
@UseGuards(ShopperSessionGuard)
@Controller('wish')
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Get()
    @ApiOkResponse()
    getWish(@Req() request: Request) {
        return this.wishlistService.getWishlist(request);
    }

    @Post('items')
    @ApiOkResponse()
    addWish(@Req() request: Request, @Body() body: AddWishItemRequestDto) {
        return this.wishlistService.addWishItem(request, body);
    }

    @Delete('items/:itemKey')
    @ApiOkResponse()
    deleteWishItem(@Req() request: Request, @Param('itemKey') itemKey: string) {
        const parsedItemId = this.parseBigInt(itemKey, 'itemKey');
        return this.wishlistService.deleteWishItem(request, parsedItemId);
    }

    @Delete()
    @ApiOkResponse()
    deleteWish(@Req() request: Request) {
        return this.wishlistService.deleteWishlist(request);
    }

    private parseBigInt(value: string | undefined, fieldName: string): bigint {
        if (!value) {
            throw new BadRequestException(`${fieldName} is required`);
        }

        try {
            return BigInt(value);
        } catch {
            throw new BadRequestException(`${fieldName} must be a bigint`);
        }
    }
}
