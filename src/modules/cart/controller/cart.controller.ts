import type { JwtPayload } from '@/common';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import {
    AddCartItemRequestDto,
    UpdateCartItemDeltaRequestDto,
} from '@/modules/cart/dto/request';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CartService } from '../service/cart.service';

@Public()
@UseGuards(ShopperSessionGuard)
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(
        @Req() req: Request,
        @GetLanguageId() langId: number,
        @GetUser() user: JwtPayload | null,
    ) {
        const guestSessionId = (req['guestSessionId'] as string | undefined) ?? null;
        if (guestSessionId) {
            return this.cartService.getCartGuest(guestSessionId, langId);
        }

        if (user) {
            return this.cartService.getCartUser(Number(user.sub), langId);
        }

        throw new Error('Guest session or user is required');
    }

    @Post('items')
    addCartItem(
        @Req() req: Request,
        @GetUser() user: JwtPayload | null,
        @Body() body: AddCartItemRequestDto,
    ) {
        const guestSessionId = (req['guestSessionId'] as string | undefined) ?? null;

        return this.cartService.addCartItem(guestSessionId, user, body);
    }

    @Patch('items/:itemKey/delta')
    updateCartItemDelta(
        @Req() req: Request,
        @GetUser() user: JwtPayload | null,
        @Param('itemKey') itemKey: string,
        @Body() body: UpdateCartItemDeltaRequestDto,
    ) {
        const guestSessionId = (req['guestSessionId'] as string | undefined) ?? null;
        const parsedItemId = Number(itemKey);

        return this.cartService.updateCartItemDelta(
            guestSessionId,
            user,
            parsedItemId,
            body,
        );
    }

    @Delete('items/:itemKey')
    removeCartItem(
        @Req() req: Request,
        @GetUser() user: JwtPayload | null,
        @Param('itemKey') itemKey: string,
    ) {
        const guestSessionId = (req['guestSessionId'] as string | undefined) ?? null;
        const parsedItemId = Number(itemKey);

        return this.cartService.removeCartItem(parsedItemId, guestSessionId, user);
    }

    @Delete()
    clearCart(
        @Req() req: Request,
        @GetUser() user: JwtPayload | null,
    ) {
        const guestSessionId = (req['guestSessionId'] as string | undefined) ?? null;

        return this.cartService.clearCart(guestSessionId, user);
    }

    // @Post('merge')
    // mergeCart(
    //     @Req() req: Request,
    //     @GetUser() user: JwtPayload | null,
    //     @Body() body: unknown,
    // ) {
    //     const guestSessionId = (req['guestSessionId'] as string | undefined) ?? null;

    //     return this.cartService.mergeCart(guestSessionId, user);
    // }
}
