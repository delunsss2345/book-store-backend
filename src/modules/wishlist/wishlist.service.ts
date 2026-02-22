import { AuthRepository } from '@/modules/auth/auth.repository';
import { GuestSessionService } from '@/modules/guest-session/guest-session.service';
import { LanguageService } from '@/modules/language/language.service';
import { WishlistItemService } from '@/modules/wishlist-item/wishlist-item.service';
import { AddWishItemRequestDto } from '@/modules/wishlist/dto/request';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { WishlistRepository } from './wishlist.repository';

type RequestUser = {
    id?: bigint | string;
};

@Injectable()
export class WishlistService {
    constructor(
        private readonly wishlistRepository: WishlistRepository,
        private readonly wishlistItemService: WishlistItemService,
        private readonly authRepository: AuthRepository,
        private readonly guestSessionService: GuestSessionService,
        private readonly languageService: LanguageService,
    ) { }

    async getWishlist(request: Request, lang?: string) {
        const language = await this.languageService.resolveLanguage(lang);
        // Chuyển sang luồng user bên dưới.
        const wishlist = await this.resolveWishlistByActor(request, true, language.id);
        if (!wishlist) {
            throw new ForbiddenException();
        }
        return wishlist;
    }

    async addWishItem(request: Request, body: AddWishItemRequestDto, lang?: string) {
        const wishlist = await this.getWishlist(request, lang);
        const bookVariantId = BigInt(body.bookVariantId);

        const existed = await this.wishlistItemService.findByWishlistIdAndBookVariantId(
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

        const createdItem = await this.wishlistItemService.createByWishlistIdAndBookVariantId(
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

    async deleteWishItem(request: Request, itemId: bigint, lang?: string) {
        const language = await this.languageService.resolveLanguage(lang);
        const wishlist = await this.resolveWishlistByActor(request, false, language.id);
        if (!wishlist) {
            throw new NotFoundException('Wishlist item not found');
        }

        const deleted = await this.wishlistItemService.deleteByIdAndWishlistId(itemId, wishlist.id);
        if (!deleted) {
            throw new NotFoundException('Wishlist item not found');
        }

        return { success: true };
    }

    async deleteWishlist(request: Request, lang?: string) {
        const language = await this.languageService.resolveLanguage(lang);
        const wishlist = await this.resolveWishlistByActor(request, false, language.id);
        if (!wishlist) {
            return { success: true };
        }

        await this.wishlistRepository.softDeleteById(wishlist.id);
        return { success: true };
    }

    
    private async resolveWishlistByActor(
        request: Request,
        createIfMissing: boolean,
        languageId: number,
    ) {
        const actor = this.resolveActor(request);
        if (actor.guestSessionId) {
            // Ưu tiên guest session; nếu cookie cũ/hết hiệu lực thì chuyển sang luồng user bên dưới.
            const guestSession = await this.guestSessionService.updateLastSeenGuestSessionById(
                actor.guestSessionId,
            );

            if (guestSession) {
                const existing = await this.wishlistRepository.findByGuestSessionId(guestSession.id, languageId);
                if (existing || !createIfMissing) {
                    return existing;
                }

                return this.wishlistRepository.createByGuestSessionId(guestSession.id, languageId);
            }
        }

        if (!actor.userId) {
            throw new ForbiddenException();
        }

        const user = await this.authRepository.findUserById(actor.userId);
        if (!user) {
            throw new ForbiddenException();
        }

        const existing = await this.wishlistRepository.findByUserId(user.id, languageId);
        if (existing || !createIfMissing) {
            return existing;
        }
        return this.wishlistRepository.createByUserId(user.id, languageId);
    }

    private resolveActor(request: Request): { guestSessionId: string | null; userId: bigint | null } {
        // Với wishlist: nếu có guestSessionId trong cookie thì ưu tiên guest trước user đã đăng nhập.
        const guestSessionId = (request.cookies?.guestSessionId as string | undefined)
            ?? (request['guestSessionId'] as string | undefined)
            ?? null;
        const requestUser = request['user'] as RequestUser | undefined;
        return {
            guestSessionId,
            userId: this.parseUserId(requestUser?.id),
        };
    }

    private parseUserId(value: bigint | string | undefined): bigint | null {
        if (typeof value === 'bigint') return value;
        if (!value) return null;

        try {
            return BigInt(value);
        } catch {
            return null;
        }
    }
}
