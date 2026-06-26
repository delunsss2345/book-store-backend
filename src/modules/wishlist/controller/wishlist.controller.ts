import { JwtPayload } from '@/common';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { AddWishItemRequestDto } from '@/modules/wishlist/dto/request';
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
import {
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { WishlistService } from '../service/wishlist.service';

@ApiTags('wish')
@Public()
@UseGuards(ShopperSessionGuard)
@Controller('wish')
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Get()
    @ApiOperation({ summary: 'Get the current wishlist for the authenticated user or guest session' })
    @ApiOkResponse({ type: Object, description: 'Wishlist with items' })
    getWish(
        @Req() request: Request,
        @GetLanguageId() langId: number,
        @GetUser() user: JwtPayload | null,
    ) {
        const { guestSessionId, userId } = this.resolveActor(request, user);
        return this.wishlistService.getWishlist(guestSessionId, userId, langId);
    }

    @Post('items')
    @ApiOperation({ summary: 'Add a book variant to the wishlist' })
    @ApiBody({ type: AddWishItemRequestDto })
    @ApiCreatedResponse({ type: Object, description: 'Result indicating whether the item was newly created or already existed' })
    addWish(
        @Req() request: Request,
        @Body() body: AddWishItemRequestDto,
        @GetLanguageId() langId: number,
        @GetUser() user: JwtPayload | null,
    ) {
        const { guestSessionId, userId } = this.resolveActor(request, user);
        return this.wishlistService.addWishItem(
            guestSessionId,
            userId,
            body,
            langId,
        );
    }

    @Delete('items/:itemKey')
    @ApiOperation({ summary: 'Remove a specific item from the wishlist by its item key' })
    @ApiParam({ name: 'itemKey', type: String, description: 'The unique key of the wishlist item to remove' })
    @ApiOkResponse({ type: Object, description: 'Deletion result' })
    deleteWishItem(
        @Req() request: Request,
        @Param('itemKey') itemKey: string,
        @GetLanguageId() langId: number,
        @GetUser() user: JwtPayload | null,
    ) {
        const { guestSessionId, userId } = this.resolveActor(request, user);
        const parsedItemId = Number(itemKey);
        return this.wishlistService.deleteWishItem(
            guestSessionId,
            userId,
            parsedItemId,
            langId,
        );
    }

    @Delete()
    @ApiOperation({ summary: 'Clear the entire wishlist for the authenticated user or guest session' })
    @ApiOkResponse({ type: Object, description: 'Deletion result' })
    deleteWish(
        @Req() request: Request,
        @GetLanguageId() langId: number,
        @GetUser() user: JwtPayload | null,
    ) {
        const { guestSessionId, userId } = this.resolveActor(request, user);
        return this.wishlistService.deleteWishlist(guestSessionId, userId, langId);
    }

    private resolveActor(
        request: Request,
        user: JwtPayload | null,
    ): { guestSessionId: string | null; userId: number | null } {
        const userId = user?.sub ? Number(user.sub) : null;
        const guestSessionId = userId
            ? null
            : ((request['guestSessionId'] as string | undefined) ?? null);

        return {
            guestSessionId,
            userId,
        };
    }
}
