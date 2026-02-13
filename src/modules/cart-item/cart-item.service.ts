import { Injectable } from '@nestjs/common';
import { CartItemRepository } from './cart-item.repository';

@Injectable()
export class CartItemService {
    constructor(private readonly cartItemRepository: CartItemRepository) { }

    findByCartIdAndBookVariantId(cartId: bigint, bookVariantId: bigint) {
        return this.cartItemRepository.findByCartIdAndBookVariantId(cartId, bookVariantId);
    }

    findByIdAndGuestSessionId(id: bigint, guestSessionId: string) {
        return this.cartItemRepository.findByIdAndGuestSessionId(id, guestSessionId);
    }

    findByIdAndUserId(id: bigint, userId: bigint) {
        return this.cartItemRepository.findByIdAndUserId(id, userId);
    }

    updateQuantityById(id: bigint, quantity: number) {
        return this.cartItemRepository.updateQuantityById(id, quantity);
    }

    createByCartIdAndBookVariantId(cartId: bigint, bookVariantId: bigint, quantity: number) {
        return this.cartItemRepository.createByCartIdAndBookVariantId(cartId, bookVariantId, quantity);
    }

    deleteByIdAndGuestSessionId(id: bigint, guestSessionId: string) {
        return this.cartItemRepository.deleteByIdAndGuestSessionId(id, guestSessionId);
    }

    deleteByIdAndUserId(id: bigint, userId: bigint) {
        return this.cartItemRepository.deleteByIdAndUserId(id, userId);
    }

    getStockByBookVariantId(bookVariantId: bigint) {
        return this.cartItemRepository.getStockByBookVariantId(bookVariantId);
    }
}
