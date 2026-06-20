import { Injectable } from '@nestjs/common';
import { CartItemRepository } from '../repository/cart-item.repository';

@Injectable()
export class CartItemService {
    constructor(private readonly cartItemRepository: CartItemRepository

    ) { }

    findByCartIdAndBookVariantId(cartId: number, bookVariantId: number) {
        return this.cartItemRepository.findByCartIdAndBookVariantId(cartId, bookVariantId);
    }

    findByIdAndGuestSessionId(id: number, guestSessionId: string) {
        return this.cartItemRepository.findByIdAndGuestSessionId(id, guestSessionId);
    }

    findByIdAndUserId(id: number, userId: number) {
        return this.cartItemRepository.findByIdAndUserId(id, userId);
    }

    updateQuantityById(id: number, quantity: number) {
        return this.cartItemRepository.updateQuantityById(id, quantity);
    }

    async createByCartIdAndBookVariantId(cartId: number, bookVariantId: number, quantity: number) {
        const bookVariant = await this.cartItemRepository.getStockByBookVariantId(bookVariantId);
        if (bookVariant === null) {
            throw new Error('Book variant not found');
        }
        if (bookVariant.available === null || bookVariant.available < quantity) {
            throw new Error('Not enough stock');
        }

        return this.cartItemRepository.createByCartIdAndBookVariantId(cartId, bookVariantId, quantity);
    }

    deleteByIdAndGuestSessionId(id: number, guestSessionId: string) {
        return this.cartItemRepository.deleteByIdAndGuestSessionId(id, guestSessionId);
    }

    deleteByIdAndUserId(id: number, userId: number) {
        return this.cartItemRepository.deleteByIdAndUserId(id, userId);
    }

    getStockByBookVariantId(bookVariantId: number) {
        return this.cartItemRepository.getStockByBookVariantId(bookVariantId);
    }
}
