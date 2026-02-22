import { GetLanguage } from '@/common/decorators/getLanguage.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { AddWishItemRequestDto } from '@/modules/wishlist/dto/request';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import {
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
    getWish(@Req() request: Request, @GetLanguage() lang: string) {
        return this.wishlistService.getWishlist(request, lang);
    }

    @Post('items')
    @ApiOkResponse()
    addWish(@Req() request: Request, @Body() body: AddWishItemRequestDto, @GetLanguage() lang: string) {
        return this.wishlistService.addWishItem(request, body, lang);
    }

    @Delete('items/:itemKey')
    @ApiOkResponse()
    deleteWishItem(@Req() request: Request, @Param('itemKey') itemKey: string, @GetLanguage() lang: string) {
        const parsedItemId = parseBigIntRequired(itemKey, 'itemKey');
        return this.wishlistService.deleteWishItem(request, parsedItemId, lang);
    }

    @Delete()
    @ApiOkResponse()
    deleteWish(@Req() request: Request, @GetLanguage() lang: string) {
        return this.wishlistService.deleteWishlist(request, lang);
    }
}
