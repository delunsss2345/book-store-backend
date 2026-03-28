import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
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
    getWish(@Req() request: Request, @GetLanguageId() langId: number) {
        return this.wishlistService.getWishlist(request, langId);
    }

    @Post('items')
    @ApiOkResponse()
    addWish(@Req() request: Request, @Body() body: AddWishItemRequestDto, @GetLanguageId() langId: number) {
        return this.wishlistService.addWishItem(request, body, langId);
    }

    @Delete('items/:itemKey')
    @ApiOkResponse()
    deleteWishItem(@Req() request: Request, @Param('itemKey') itemKey: string, @GetLanguageId() langId: number) {
        const parsedItemId = parseBigIntRequired(itemKey, 'itemKey');
        return this.wishlistService.deleteWishItem(request, parsedItemId, langId);
    }

    @Delete()
    @ApiOkResponse()
    deleteWish(@Req() request: Request, @GetLanguageId() langId: number) {
        return this.wishlistService.deleteWishlist(request, langId);
    }
}
