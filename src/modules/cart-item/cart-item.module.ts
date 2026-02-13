import { Module } from '@nestjs/common';
import { CartItemRepository } from './cart-item.repository';
import { CartItemService } from './cart-item.service';

@Module({
    providers: [CartItemService, CartItemRepository],
    exports: [CartItemService, CartItemRepository],
})
export class CartItemModule { }
