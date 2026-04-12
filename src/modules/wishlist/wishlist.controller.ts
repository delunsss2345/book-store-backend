import { JwtPayload } from '@/common';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
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
    getWish(
        @Req() request: Request,
        @GetLanguageId() langId: number,
        @GetUser() user: JwtPayload | null,
    ) {
        const { guestSessionId, userId } = this.resolveActor(request, user);
        return this.wishlistService.getWishlist(guestSessionId, userId, langId);
    }

    @Post('items')
    @ApiOkResponse()
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
    @ApiOkResponse()
    deleteWishItem(
        @Req() request: Request,
        @Param('itemKey') itemKey: string,
        @GetLanguageId() langId: number,
        @GetUser() user: JwtPayload | null,
    ) {
        const { guestSessionId, userId } = this.resolveActor(request, user);
        const parsedItemId = parseBigIntRequired(itemKey, 'itemKey');
        return this.wishlistService.deleteWishItem(
            guestSessionId,
            userId,
            parsedItemId,
            langId,
        );
    }

    @Delete()
    @ApiOkResponse()
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
    ): { guestSessionId: string | null; userId: bigint | null } {
        const userId = user?.sub ? BigInt(user.sub) : null;
        const guestSessionId = userId
            ? null
            : ((request['guestSessionId'] as string | undefined) ?? null);

        return {
            guestSessionId,
            userId,
        };
    }
}
