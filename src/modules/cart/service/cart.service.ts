import { CartMessage, JwtPayload } from '@/common';
import { PrismaClientTransaction } from '@/database';
import { AuthService } from '@/modules/auth/service/auth.service';
import {
  AddCartItemRequestDto,
  UpdateCartItemDeltaRequestDto,
} from '@/modules/cart/dto/request';
import { MergeCartResponseDto } from '@/modules/cart/dto/response/merge-cart.response.dto';
import { CartItemService } from '@/modules/cart/service/cart-item.service';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CartRepository } from '../repository/cart.repository';

type CartRequestUser = {
  id?: number | string;
};

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly cartItemService: CartItemService,
    private readonly authService: AuthService,
  ) { }

  async getCartUser(userId: number, langId: number) {
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

  // Cho phép domain khác (vd OrderService) xoá cart theo userId qua service thay vì repository
  deleteByUserId(userId: number) {
    return this.cartRepository.deleteByUserId(userId);
  }

  findByGuestSessionId(guestSessionId: string, tx: PrismaClientTransaction) {
    return this.cartRepository.findByGuestSessionIdForOrder(guestSessionId, tx);
  }

  findByCartIdAndUserId(cartId: number, userId: number, tx: PrismaClientTransaction) {
    return this.cartRepository.findByCartIdAndUserId(cartId, userId, tx);
  }

  async addCartItem(
    guestSessionId: string | null,
    user: JwtPayload | null,
    body: AddCartItemRequestDto,
  ) {
    const bookVariantId = Number(body.bookVariantId);
    const quantity = body.quantity ?? 1;
    console.log(user);
    if (user) {
      const userId = Number(user.sub);
      Logger.log(`userId : ${userId}`);
      const foundUser = await this.authService.findUserById(userId);

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



    throw new ForbiddenException('Guest session or user is required');
  }

  async updateCartItemDelta(
    guestSessionId: string | null,
    user: JwtPayload | null,
    itemId: number,
    body: UpdateCartItemDeltaRequestDto,
  ) {
    if (user) {
      const userId = Number(user.sub);
      const foundUser = await this.authService.findUserById(userId);

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

    throw new ForbiddenException('Guest session or user is required');
  }

  async removeCartItem(
    itemId: number,
    guestSessionId?: string | null,
    user?: JwtPayload | null,
  ) {
    if (user) {
      const foundUser = await this.authService.findUserById(Number(user.sub));
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

    throw new ForbiddenException("Vui lòng thử lại sau");
  }

  async clearCart(
    guestSessionId?: string | null,
    user?: JwtPayload | null,
  ) {
    if (user?.sub) {
      const foundUser = await this.authService.findUserById(Number(user.sub));
      if (!foundUser) {
        throw new ForbiddenException();
      }

      await this.cartRepository.deleteByUserId(foundUser.id);
      return { success: true };
    }

    if (guestSessionId) {
      await this.cartRepository.deleteByGuestSessionId(guestSessionId);
      return { success: true };
    }

    throw new ForbiddenException();
  }
  async mergeCart(guestSessionId: string, userId: number): Promise<MergeCartResponseDto> {
    this.logger.log(`Merging cart: userId=${userId}, guestSessionId=${guestSessionId}`);

    const [guestCart, userCart] = await Promise.all([
      this.cartRepository.findCartByGuestSessionId(guestSessionId),
      this.cartRepository.findCartByUserId(userId),
    ]);

    if (!guestCart) {
      this.logger.log(`Merge cart skipped: guest cart not found, userId=${userId}, guestSessionId=${guestSessionId}`);
      return {
        mergeCart: true,
        mergeCount: 0,
      };
    }

    if (!userCart) {
      await this.cartRepository.updateGuestCart(guestCart.id, userId);
      this.logger.log(`Merge cart completed by assigning guest cart: userId=${userId}, guestCartId=${guestCart.id}, mergeCount=${guestCart.items.length}`);
      return {
        mergeCart: true,
        mergeCount: guestCart.items.length,
      }
    }

    const userCartMap = new Map<number, number>();
    if (userCart) {
      for (const item of userCart.items) {
        userCartMap.set(item.bookVariantId, item.quantity);
      }
    }
    let mergeCount = 0;
    const mergedItems: {
      bookVariantId: number,
      quantity: number
    }[] = [];
    for (const guestItem of guestCart.items) {
      const exitItem = userCartMap.get(guestItem.bookVariantId) || 0;
      if (exitItem) {
        mergedItems.push({
          bookVariantId: guestItem.bookVariantId,
          quantity: exitItem + guestItem.quantity
        })
      } else {
        mergedItems.push({
          bookVariantId: guestItem.bookVariantId,
          quantity: exitItem + guestItem.quantity
        })
        mergeCount++
      }
    }

    await this.mergeCartUser(userCart.id, mergedItems);
    this.logger.log(`Merge cart completed: userId=${userId}, guestCartId=${guestCart.id}, userCartId=${userCart.id}, mergeCount=${mergeCount}`);
    return {
      mergeCount,
      mergeCart: true
    }
  }

  private async mergeCartUser(cartId: number, items: { bookVariantId: number, quantity: number }[]) {
    return this.cartRepository.updateCartByUserId(cartId, items);
  }

  // Điều chỉnh giá 
  private async resolveAdjustedQuantity(
    guestSessionId: string | undefined,
    userId: number | undefined,
    itemId: number,
    bookVariantId: number,
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
