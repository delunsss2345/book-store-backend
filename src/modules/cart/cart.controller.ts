import { JwtPayload } from '@/common';
import { Public } from '@/common/security/decorators/public.decorator';
import { CartGuestSessionGuard } from '@/common/security/guard/cart-guest-session.guard';
import { AddCartItemRequestDto, UpdateCartItemDeltaRequestDto } from '@/modules/cart/dto/request';
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CartService } from './cart.service';
@Public()
@UseGuards(CartGuestSessionGuard)
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(@Req() req: Request) {
        const guestSessionId = req['guestSessionId'] as string;
        console.log(req)
        const user = req['user'] as JwtPayload;
        if (guestSessionId) {
            return this.cartService.getCartGuest(guestSessionId);
        }
        return this.cartService.getCartUser(BigInt(user.sub));
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
        const parsedItemId = this.parseBigInt(itemKey, 'itemKey');
        return this.cartService.updateCartItemDelta(request, parsedItemId, body);
    }

    @Delete('items/:itemKey')
    removeCartItem(@Req() request: Request, @Param('itemKey') itemKey: string) {
        const parsedItemId = this.parseBigInt(itemKey, 'itemKey');
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
