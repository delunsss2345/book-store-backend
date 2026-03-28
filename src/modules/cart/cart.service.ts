import { AuthRepository } from '@/modules/auth/auth.repository';
import { CartItemService } from '@/modules/cart-item/cart-item.service';
import { AddCartItemRequestDto, UpdateCartItemDeltaRequestDto } from '@/modules/cart/dto/request';
import { ForbiddenException, Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { Request } from 'express';
import { CartRepository } from './cart.repository';

type CartRequestUser = {
    id?: bigint | string;
};

@Injectable()
export class CartService {
    constructor(
        private readonly cartRepository: CartRepository,
        private readonly cartItemService: CartItemService,
        private readonly authRepository: AuthRepository,
    ) { }

    async getCartUser(userId: bigint, langId: number) {
        const result = await this.cartRepository.findByUserId(userId, langId);
        if (result) return result;
        return this.cartRepository.createCartByUserId(userId, langId);
    }

    async getCartGuest(guestSessionId: string, langId: number) {
        const result = await this.cartRepository.findByGuestSessionId(guestSessionId, langId);
        if (result) return result;
        return this.cartRepository.createCartByGuestSessionId(guestSessionId, langId);
    }
    async addCartItem(request: Request, body: AddCartItemRequestDto) {
        const bookVariantId = BigInt(body.bookVariantId);
        const quantity = (body.quantity);
        const actor = this.resolveActor(request);

        if (actor.authError || !actor.userId) {
            if (!actor.guestSessionId) {
                throw new ForbiddenException();
            }

            const guestCart = await this.cartRepository.findByGuestSessionId(actor.guestSessionId);
            if (!guestCart) {
                const createdCart = await this.cartRepository.createByGuestSessionId(actor.guestSessionId);
                const createdItem = await this.cartItemService.createByCartIdAndBookVariantId(
                    createdCart.id,
                    bookVariantId,
                    quantity ?? 1,
                );

                return {
                    authError: true,
                    item: {
                        id: createdItem.id.toString(),
                        bookVariantId: Number(createdItem.bookVariantId),
                        quantity: createdItem.quantity,
                    },
                };
            }

            const existed = guestCart.items.find((item) => item.bookVariantId === bookVariantId);

            if (existed) {
                const updatedItem = await this.cartItemService.updateQuantityById(existed.id, existed.quantity + (quantity ?? 1));
                return {
                    authError: true,
                    item: {
                        id: updatedItem.id.toString(),
                        bookVariantId: Number(updatedItem.bookVariantId),
                        quantity: updatedItem.quantity,
                    },
                };
            }
            const createdItem = await this.cartItemService.createByCartIdAndBookVariantId(guestCart.id, bookVariantId, ((quantity ?? 1)));
            return {
                authError: true,
                item: {
                    id: createdItem.id.toString(),
                    bookVariantId: Number(createdItem.bookVariantId),
                    quantity: createdItem.quantity,
                },
            };
        }

        const user = await this.authRepository.findUserById(actor.userId);
        if (!user) {
            throw new ForbiddenException();
        }

        let cart = await this.cartRepository.findByUserId(user.id);
        if (!cart) {
            cart = await this.cartRepository.createCartByUserId(user.id);
        }

        const existedItem = await this.cartItemService.findByCartIdAndBookVariantId(cart.id, bookVariantId);
        if (existedItem) {
            const updatedItem = await this.cartItemService.updateQuantityById(existedItem.id, existedItem.quantity + ((quantity ?? 1)));
            return {
                authError: false,
                cartItem: {
                    itemKey: updatedItem.id.toString(),
                    bookVariantId: Number(updatedItem.bookVariantId),
                    quantity: updatedItem.quantity,
                },
            };
        }

        const createdItem = await this.cartItemService.createByCartIdAndBookVariantId(cart.id, bookVariantId, ((quantity ?? 1)));
        return {
            authError: false,
            cartItem: {
                itemKey: createdItem.id.toString(),
                bookVariantId: Number(createdItem.bookVariantId),
                quantity: createdItem.quantity,
            },
        };
    }

    async updateCartItemDelta(
        request: Request,
        itemId: bigint,
        body: UpdateCartItemDeltaRequestDto,
    ) {
        const actor = this.resolveActor(request);

        if (actor.authError || !actor.userId) {
            if (!actor.guestSessionId) {
                throw new ForbiddenException();
            }

            const item = await this.cartItemService.findByIdAndGuestSessionId(itemId, actor.guestSessionId);
            if (!item) {
                throw new NotFoundException('Cart item not found');
            }

            const quantity = await this.resolveAdjustedQuantity(item.bookVariantId, item.quantity, body.quantity);
            const updatedItem = await this.cartItemService.updateQuantityById(item.id, quantity);

            return {
                authError: true,
                cartItem: {
                    itemKey: updatedItem.id.toString(),
                    bookVariantId: Number(updatedItem.bookVariantId),
                    quantity: updatedItem.quantity,
                },
            };
        }

        const user = await this.authRepository.findUserById(actor.userId);
        if (!user) {
            throw new ForbiddenException();
        }

        const item = await this.cartItemService.findByIdAndUserId(itemId, user.id);
        if (!item) {
            throw new NotFoundException('Cart item not found');
        }

        const quantity = await this.resolveAdjustedQuantity(item.bookVariantId, item.quantity, body.quantity);
        const updatedItem = await this.cartItemService.updateQuantityById(item.id, quantity);

        return {
            authError: false,
            cartItem: {
                itemKey: updatedItem.id.toString(),
                bookVariantId: Number(updatedItem.bookVariantId),
                quantity: updatedItem.quantity,
            },
        };
    }

    async removeCartItem(request: Request, itemId: bigint) {
        const actor = this.resolveActor(request);

        if (actor.authError || !actor.userId) {
            if (!actor.guestSessionId) {
                throw new ForbiddenException();
            }

            const deleted = await this.cartItemService.deleteByIdAndGuestSessionId(itemId, actor.guestSessionId);
            if (!deleted) {
                throw new NotFoundException('Cart item not found');
            }

            return { authError: true, success: true };
        }

        const user = await this.authRepository.findUserById(actor.userId);
        if (!user) {
            throw new ForbiddenException();
        }

        const deleted = await this.cartItemService.deleteByIdAndUserId(itemId, user.id);
        if (!deleted) {
            throw new NotFoundException('Cart item not found');
        }

        return { authError: false, success: true };
    }

    async clearCart(request: Request) {
        const actor = this.resolveActor(request);

        if (actor.authError || !actor.userId) {
            if (!actor.guestSessionId) {
                throw new ForbiddenException();
            }

            await this.cartRepository.deleteByGuestSessionId(actor.guestSessionId);
            return { authError: true, success: true };
        }

        const user = await this.authRepository.findUserById(actor.userId);
        if (!user) {
            throw new ForbiddenException();
        }

        await this.cartRepository.deleteByUserId(user.id);
        return { authError: false, success: true };
    }

    mergeCart(_: unknown) {
        throw new NotImplementedException('Cart merge is not implemented yet');
    }

    private async resolveAdjustedQuantity(
        bookVariantId: bigint,
        currentQuantity: number,
        delta: number,
    ): Promise<number> {
        const desiredQuantity = Math.max(0, currentQuantity + delta);
        const stock = await this.cartItemService.getStockByBookVariantId(bookVariantId);

        if (stock === null || stock === undefined) {
            return desiredQuantity;
        }

        const normalizedStock = Math.max(0, stock);
        return Math.min(desiredQuantity, normalizedStock);
    }

    private resolveActor(request: Request): { authError: boolean; userId: bigint | null; guestSessionId: string | null } {
        const requestUser = request['user'] as CartRequestUser | undefined;
        return {
            authError: Boolean(request['authError']),
            userId: this.parseUserId(requestUser?.id),
            guestSessionId: (request['guestSessionId'] as string | undefined) ?? null,
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
