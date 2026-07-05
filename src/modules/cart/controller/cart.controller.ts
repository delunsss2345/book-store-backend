import type { JwtPayload } from '@/common';
import { GetGuestSessionId } from '@/common/decorators/getGuestSessionId.decorator';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import {
    AddCartItemRequestDto,
    UpdateCartItemDeltaRequestDto,
} from '@/modules/cart/dto/request';
import { CartResponseDto } from '@/modules/cart/dto/response/cart.response.dto';
import { MergeCartResponseDto } from '@/modules/cart/dto/response/merge-cart.response.dto';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import { CartService } from '../service/cart.service';

@ApiTags('Cart')
@Public()
@UseGuards(ShopperSessionGuard)
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    @ApiOperation({ summary: 'Get the current cart for authenticated user or guest session' })
    @ApiOkResponse({ type: CartResponseDto })
    getCart(
        @GetGuestSessionId() guestSessionId: string | null,
        @GetLanguageId() langId: number,
        @GetUser() user: JwtPayload | null,
    ) {
        if (user) {
            return this.cartService.getCartUser(Number(user.sub), langId);
        }

        if (guestSessionId) {
            return this.cartService.getCartGuest(guestSessionId, langId);
        }

        throw new Error('Guest session or user is required');
    }

    @Post('items')
    @ApiOperation({ summary: 'Add an item to the cart' })
    @ApiCreatedResponse({ type: CartResponseDto })
    addCartItem(
        @GetGuestSessionId() guestSessionId: string | null,
        @GetUser() user: JwtPayload | null,
        @Body() body: AddCartItemRequestDto,
        @GetLanguageId() langId: number
    ) {
        return this.cartService.addCartItem(guestSessionId, user, body, langId);
    }

    @Patch('items/:itemKey/delta')
    @ApiOperation({ summary: 'Update the quantity delta of a cart item' })
    @ApiParam({ name: 'itemKey', type: Number, description: 'Cart item ID' })
    @ApiOkResponse({ type: CartResponseDto })
    updateCartItemDelta(
        @GetGuestSessionId() guestSessionId: string | null,
        @GetUser() user: JwtPayload | null,
        @Param('itemKey') itemKey: string,
        @Body() body: UpdateCartItemDeltaRequestDto,
    ) {
        const parsedItemId = Number(itemKey);

        return this.cartService.updateCartItemDelta(
            guestSessionId,
            user,
            parsedItemId,
            body,
        );
    }

    @Delete('items/:itemKey')
    @ApiOperation({ summary: 'Remove an item from the cart' })
    @ApiParam({ name: 'itemKey', type: Number, description: 'Cart item ID' })
    @ApiOkResponse({ type: CartResponseDto })
    removeCartItem(
        @GetGuestSessionId() guestSessionId: string | null,
        @GetUser() user: JwtPayload | null,
        @Param('itemKey') itemKey: string,
    ) {
        const parsedItemId = Number(itemKey);

        return this.cartService.removeCartItem(parsedItemId, guestSessionId, user);
    }

    @Delete()
    @ApiOperation({ summary: 'Clear all items from the cart' })
    @ApiOkResponse({ description: 'Cart cleared successfully' })
    clearCart(
        @GetUser() user: JwtPayload | null,
        @GetGuestSessionId() guestSessionId: string | null
    ) {
        if (!guestSessionId && !user) {
            throw new Error('Guest session or user is required to clear cart');
        }
        return this.cartService.clearCart(guestSessionId, user);
    }

    @Post('merge')
    @ApiOperation({ summary: 'Merge guest cart into the authenticated user cart' })
    @ApiCreatedResponse({ type: MergeCartResponseDto })
    mergeCart(
        @GetUser() user: JwtPayload | null,
        @GetGuestSessionId() guestSessionId: string | null
    ): Promise<MergeCartResponseDto> {
        const userId = Number(user?.sub);
        if (!userId) {
            throw new Error('User is required to merge cart')
        }
        if (!user) {
            throw new Error('User is required to merge cart');
        }
        if (!guestSessionId) {
            throw new Error('Guest session is required to merge cart');
        }
        return this.cartService.mergeCart(guestSessionId, userId);
    }
}
