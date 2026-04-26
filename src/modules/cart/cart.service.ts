import { CartMessage, JwtPayload } from '@/common';
import { AuthRepository } from '@/modules/auth/auth.repository';
import { CartItemService } from '@/modules/cart-item/cart-item.service';
import {
  AddCartItemRequestDto,
  UpdateCartItemDeltaRequestDto,
} from '@/modules/cart/dto/request';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
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
    const result = await this.cartRepository.findByGuestSessionId(
      guestSessionId,
      langId,
    );
    if (result) return result;
    return this.cartRepository.createCartByGuestSessionId(
      guestSessionId,
      langId,
    );
  }

  async addCartItem(
    guestSessionId: string | null,
    user: JwtPayload | null,
    body: AddCartItemRequestDto,
  ) {
    const bookVariantId = BigInt(body.bookVariantId);
    const quantity = body.quantity ?? 1;
    if (guestSessionId) {
      let guestCart = await this.cartRepository.findByGuestSessionId(guestSessionId);

      if (!guestCart) {
        guestCart = await this.cartRepository.createCartByGuestSessionId(guestSessionId);
      }

      const existedItem = guestCart.items.find(
        (item) => item.bookVariantId === bookVariantId,
      );

      if (existedItem) {
        // Kiểm tra xem số lượng mới có vượt quá tồn kho không, nếu có thì chỉ cập nhật đến mức tồn kho.
        const adjustedQuantity = await this.resolveAdjustedQuantity(guestSessionId, undefined, existedItem.id, bookVariantId, existedItem.quantity, quantity);
        Logger.debug("Quantity", quantity)

        if (!adjustedQuantity) return {
          success: true
        }
        const updatedItem = await this.cartItemService.updateQuantityById(
          existedItem.id,
          adjustedQuantity,
        );

        return {
          cartItem: {
            itemKey: updatedItem.id.toString(),
            bookVariantId: Number(updatedItem.bookVariantId),
            quantity: updatedItem.quantity,
          },
        };
      }

      const createdItem = await this.cartItemService.createByCartIdAndBookVariantId(
        guestCart.id,
        bookVariantId,
        quantity,
      );

      return {
        cartItem: {
          itemKey: createdItem.id.toString(),
          bookVariantId: Number(createdItem.bookVariantId),
          quantity: createdItem.quantity,
        },
      };
    }

    if (user) {
      const userId = BigInt(user.sub);
      const foundUser = await this.authRepository.findUserById(userId);

      if (!foundUser) {
        throw new ForbiddenException();
      }

      let cart = await this.cartRepository.findByUserId(foundUser.id);
      if (!cart) {
        cart = await this.cartRepository.createCartByUserId(foundUser.id);
      }

      const existedItem = await this.cartItemService.findByCartIdAndBookVariantId(
        cart.id,
        bookVariantId,
      );

      if (existedItem) {
        const adjustedQuantity = await this.resolveAdjustedQuantity(undefined, userId, existedItem.id, bookVariantId, existedItem.quantity, quantity);
        const updatedItem = await this.cartItemService.updateQuantityById(
          existedItem.id,
          adjustedQuantity,
        );


        return {
          cartItem: {
            itemKey: updatedItem.id.toString(),
            bookVariantId: Number(updatedItem.bookVariantId),
            quantity: updatedItem.quantity,
          },
        };
      }

      const createdItem = await this.cartItemService.createByCartIdAndBookVariantId(
        cart.id,
        bookVariantId,
        quantity,
      );

      return {
        cartItem: {
          itemKey: createdItem.id.toString(),
          bookVariantId: Number(createdItem.bookVariantId),
          quantity: createdItem.quantity,
        },
      };
    }

    throw new ForbiddenException('Guest session or user is required');
  }

  async updateCartItemDelta(
    guestSessionId: string | null,
    user: JwtPayload | null,
    itemId: bigint,
    body: UpdateCartItemDeltaRequestDto,
  ) {
    if (guestSessionId) {
      const item = await this.cartItemService.findByIdAndGuestSessionId(
        itemId,
        guestSessionId,
      );

      if (!item) {
        throw new NotFoundException(CartMessage.CART_ITEM_NOT_FOUND);
      }

      const quantity = await this.resolveAdjustedQuantity(
        guestSessionId,
        undefined,
        item.id,
        item.bookVariantId,
        item.quantity,
        body.quantity,
      );
      if (!quantity) {
        return {
          cartItem: {
            itemKey: item.id.toString(),
            bookVariantId: Number(item.bookVariantId),
            quantity,
            remove: true
          },
        }
      } else {
        const updatedItem = await this.cartItemService.updateQuantityById(
          item.id,
          quantity,
        );
        return {
          cartItem: {
            itemKey: updatedItem.id.toString(),
            bookVariantId: Number(updatedItem.bookVariantId),
            quantity: updatedItem.quantity,
          },
        };
      }
    }

    if (user) {
      const userId = BigInt(user.sub);
      const foundUser = await this.authRepository.findUserById(userId);

      if (!foundUser) {
        throw new ForbiddenException();
      }

      const item = await this.cartItemService.findByIdAndUserId(
        itemId,
        foundUser.id,
      );

      if (!item) {
        throw new NotFoundException(CartMessage.CART_ITEM_NOT_FOUND);
      }

      const quantity = await this.resolveAdjustedQuantity(
        undefined,
        userId,
        item.id,
        item.bookVariantId,
        item.quantity,
        body.quantity,
      );
      if (!quantity) {
        return {
          cartItem: {
            itemKey: item.id.toString(),
            bookVariantId: Number(item.bookVariantId),
            quantity,
            remove: true
          },
        }
      } else {
        const updatedItem = await this.cartItemService.updateQuantityById(
          item.id,
          quantity,
        );
        return {
          cartItem: {
            itemKey: updatedItem.id.toString(),
            bookVariantId: Number(updatedItem.bookVariantId),
            quantity: updatedItem.quantity,
          },
        };
      }
    }

    throw new ForbiddenException('Guest session or user is required');
  }

  async removeCartItem(
    itemId: bigint,
    guestSessionId?: string | null,
    user?: JwtPayload | null,
  ) {
    if (guestSessionId) {
      const deleted = await this.cartItemService.deleteByIdAndGuestSessionId(
        itemId,
        guestSessionId,
      );

      if (!deleted) {
        throw new NotFoundException(CartMessage.CART_ITEM_NOT_FOUND);
      }

      return { success: true };
    }
    if (user) {
      const foundUser = await this.authRepository.findUserById(BigInt(user.sub));
      if (!foundUser) {
        throw new ForbiddenException();
      }

      const deleted = await this.cartItemService.deleteByIdAndUserId(
        itemId,
        foundUser.id,
      );

      if (!deleted) {
        throw new NotFoundException(CartMessage.CART_ITEM_NOT_FOUND);
      }

      return { success: true };
    }

    throw new ForbiddenException("Vui lòng thử lại sau");
  }

  async clearCart(
    guestSessionId?: string | null,
    user?: JwtPayload | null,
  ) {
    if (guestSessionId) {
      await this.cartRepository.deleteByGuestSessionId(guestSessionId);
      return { success: true };
    }

    if (user?.sub) {
      const foundUser = await this.authRepository.findUserById(BigInt(user.sub));
      if (!foundUser) {
        throw new ForbiddenException();
      }

      await this.cartRepository.deleteByUserId(foundUser.id);
      return { success: true };
    }

    throw new ForbiddenException();
  }
  mergeCart(guestSessionId: string, user: JwtPayload) {
    throw new NotImplementedException(
      CartMessage.CART_MERGE_IS_NOT_IMPLEMENTED_YET,
    );
  }

  // Điều chỉnh giá 
  private async resolveAdjustedQuantity(
    guestSessionId: string | undefined,
    userId: bigint | undefined,
    itemId: bigint,
    bookVariantId: bigint,
    currentQuantity: number,
    delta: number,
  ): Promise<number> {
    // giá lúc tăng
    const desiredQuantity = Math.max(0, currentQuantity + delta);
    if (!desiredQuantity) {
      if (guestSessionId) {
        await this.cartItemService.deleteByIdAndGuestSessionId(itemId, guestSessionId);
      }
      else if (userId) {
        await this.cartItemService.deleteByIdAndUserId(itemId, userId);
      }
    }
    // tồn kho
    const stock =
      await this.cartItemService.getStockByBookVariantId(bookVariantId);
    if (!stock) throw new NotFoundException("Sản phẩm đã hết hàng");

    const normalizedStock = Math.max(0, stock?.available ?? 0);
    if (!normalizedStock) throw new NotFoundException("Sản phẩm đã hết hàng");

    return Math.min(desiredQuantity, normalizedStock);
  }

}
