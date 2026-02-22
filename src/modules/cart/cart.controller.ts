import { JwtPayload } from '@/common';
import { GetLanguage } from '@/common/decorators/getLanguage.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { AddCartItemRequestDto, UpdateCartItemDeltaRequestDto } from '@/modules/cart/dto/request';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CartService } from './cart.service';
@Public()
@UseGuards(ShopperSessionGuard)
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(@Req() req: Request, @GetLanguage() lang: string) {
        const guestSessionId = req['guestSessionId'] as string;
        const user = req['user'] as JwtPayload;
        if (guestSessionId) {
            return this.cartService.getCartGuest(guestSessionId, lang);
        }
        return this.cartService.getCartUser(BigInt(user.sub), lang);
    }

    @Post('items')
    addCartItem(@Req() request: Request, @Body() body: AddCartItemRequestDto) {
        return this.cartService.addCartItem(request, body);
    }

    @Patch('items/:itemKey/delta')
    updateCartItemDelta(
        @Req() request: Request,
        @Param('itemKey') itemKey: string,
        @Body() body: UpdateCartItemDeltaRequestDto,
    ) {
        const parsedItemId = parseBigIntRequired(itemKey, 'itemKey');
        return this.cartService.updateCartItemDelta(request, parsedItemId, body);
    }

    @Delete('items/:itemKey')
    removeCartItem(@Req() request: Request, @Param('itemKey') itemKey: string) {
        const parsedItemId = parseBigIntRequired(itemKey, 'itemKey');
        return this.cartService.removeCartItem(request, parsedItemId);
    }

    @Delete()
    clearCart(@Req() request: Request) {
        return this.cartService.clearCart(request);
    }

    @Post('merge')
    mergeCart(@Body() body: unknown) {
        return this.cartService.mergeCart(body);
    }
}
