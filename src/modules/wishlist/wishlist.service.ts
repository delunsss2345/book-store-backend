import { WishlistMessage } from '@/common';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { WishlistItemService } from '@/modules/wishlist-item/wishlist-item.service';
import { AddWishItemRequestDto } from '@/modules/wishlist/dto/request';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WishlistRepository } from './wishlist.repository';

@Injectable()
export class WishlistService {
  constructor(
    private readonly wishlistRepository: WishlistRepository,
    private readonly wishlistItemService: WishlistItemService,
    private readonly authRepository: AuthRepository,
  ) {}

  async getWishlist(
    guestSessionId: string | null,
    userId: bigint | null,
    langId: number,
  ) {
    const wishlist = await this.resolveWishlistByActor(
      guestSessionId,
      userId,
      true,
      langId,
    );
    if (!wishlist) {
      throw new ForbiddenException();
    }
    return wishlist;
  }

  async addWishItem(
    guestSessionId: string | null,
    userId: bigint | null,
    body: AddWishItemRequestDto,
    langId: number,
  ) {
    const wishlist = await this.getWishlist(guestSessionId, userId, langId);
    const bookVariantId = BigInt(body.bookVariantId);

    const existed =
      await this.wishlistItemService.findByWishlistIdAndBookVariantId(
        wishlist.id,
        bookVariantId,
      );

    // Mỗi biến thể chỉ giữ 1 dòng để tránh trùng item trong wishlist.
    if (existed) {
      return {
        created: false,
        wishItem: {
          itemKey: existed.id.toString(),
          bookVariantId: Number(existed.bookVariantId),
        },
      };
    }

    const createdItem =
      await this.wishlistItemService.createByWishlistIdAndBookVariantId(
        wishlist.id,
        bookVariantId,
      );
    return {
      created: true,
      wishItem: {
        itemKey: createdItem.id.toString(),
        bookVariantId: Number(createdItem.bookVariantId),
      },
    };
  }

  async deleteWishItem(
    guestSessionId: string | null,
    userId: bigint | null,
    itemId: bigint,
    langId: number,
  ) {
    const wishlist = await this.resolveWishlistByActor(
      guestSessionId,
      userId,
      false,
      langId,
    );
    if (!wishlist) {
      throw new NotFoundException(WishlistMessage.WISHLIST_ITEM_NOT_FOUND);
    }

    const deleted = await this.wishlistItemService.deleteByIdAndWishlistId(
      itemId,
      wishlist.id,
    );
    if (!deleted) {
      throw new NotFoundException(WishlistMessage.WISHLIST_ITEM_NOT_FOUND);
    }

    return { success: true };
  }

  async deleteWishlist(
    guestSessionId: string | null,
    userId: bigint | null,
    langId: number,
  ) {
    const wishlist = await this.resolveWishlistByActor(
      guestSessionId,
      userId,
      false,
      langId,
    );
    if (!wishlist) {
      return { success: true };
    }

    await this.wishlistRepository.softDeleteById(wishlist.id);
    return { success: true };
  }

  private async resolveWishlistByActor(
    guestSessionId: string | null,
    userId: bigint | null,
    createIfMissing: boolean,
    languageId: number,
  ) {
    if (userId) {
      const user = await this.authRepository.findUserById(userId);
      if (!user) {
        throw new ForbiddenException();
      }

      const existing = await this.wishlistRepository.findByUserId(
        user.id,
        languageId,
      );
      if (existing || !createIfMissing) {
        return existing;
      }

      return this.wishlistRepository.createByUserId(user.id, languageId);
    }

    if (guestSessionId) {
      const existing = await this.wishlistRepository.findByGuestSessionId(
        guestSessionId,
        languageId,
      );
      if (existing || !createIfMissing) {
        return existing;
      }

      return this.wishlistRepository.createByGuestSessionId(
        guestSessionId,
        languageId,
      );
    }

    throw new ForbiddenException();
  }
}
