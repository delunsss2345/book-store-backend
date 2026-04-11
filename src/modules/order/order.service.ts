import { OrderMessage, SHIPPING_FEE } from '@/common';
import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
import { PrismaService } from '@/database';
import { CartRepository } from '@/modules/cart/cart.repository';
import { OrderItemRepository } from '@/modules/order-item/order-item.repository';
import {
  CreateGuestOrdersAndPaymentDTO,
  CreateUserOrdersAndPaymentDTO,
} from '@/modules/order/dto/request/create-orders.dto';
import { OrderRepository } from '@/modules/order/order.repository';
import { generateContentHash } from '@/utils/generateContentHash.util';
import { generateOrderCode } from '@/utils/generateOrderCode.util';
import { generateSKU } from '@/utils/generateSku.util';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  CartItem,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  UserAddress,
} from '@prisma/client';
import crypto from 'crypto';
import { CatalogRepository } from '../catalog/catalog.repository';
import { PaymentService } from '../payment/payment.service';
@Injectable()
export class OrderService {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly catalogRepository: CatalogRepository,
    private readonly orderRepository: OrderRepository,
    private readonly prisma: PrismaService,
    private readonly cartRepository: CartRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) { }

  /**
   * Generates a hash string for the given cart items and cartId.
   *
   * @param items Cart items to generate the hash string from.
   * @param cartId Cart id to generate the hash string from.
   * @returns A hash string representing the given cart items and cartId.
   */
  getCartHash(items: CartItem[], cartId: bigint) {
    // Clone để tránh đổi array
    const sortedItems = [...items].sort((a, b) =>
      a.id.toString().localeCompare(b.id.toString()),
    );

    const content = sortedItems
      .map((item) => `${item.bookVariantId}:${item.quantity}`)
      .join('|');

    return crypto
      .createHash('md5')
      .update(content + cartId.toString())
      .digest('hex');
  }

  // Xử lí orderItems
  // Optimize from N + 1 queries to 5 queries
  private async processOrderItems(
    tx: any,
    cart: any,
    languageId: number,
    orderId: bigint,
  ) {
    const mapBookVariant = new Map<
      string,
      { quantity: number; price: number }
    >();

    cart.items.forEach((item) =>
      mapBookVariant.set(item.bookVariantId.toString(), {
        quantity: item.quantity,
        price: Number(item.variant.price),
      }),
    );

    const bookVariants = await this.catalogRepository.findBookVariantByIds(
      [...mapBookVariant.keys()].map((id) => BigInt(id)),
      languageId,
    );

    const variantMap = new Map(bookVariants.map((v) => [v.id.toString(), v]));

    bookVariants.forEach((v) => {
      const variantCardItem = mapBookVariant.get(v.id.toString());
      const variant = variantMap.get(v.id.toString());
      const available = variant?.stock ?? 0 - (variant?.reserved ?? 0);
      if (!v) throw new ForbiddenException(OrderMessage.BOOK_VARIANT_NOT_FOUND);

      if (!v.stock || available < (variantCardItem?.quantity ?? 0)) {
        Logger.error(
          `Book variant ${v.id} out of stock. Available: ${available}, Required: ${variantCardItem?.quantity ?? 0}`,
        );
        throw new ForbiddenException(
          OrderMessage.BOOK_OUT_OF_STOCK(
            v.book.translations?.[0]?.title || 'Không rõ',
          ),
        );
      }
    });

    let subtotal = 0;
    await Promise.all(
      cart.items.map(async (item) => {
        const bookVariant = variantMap.get(item.bookVariantId.toString());
        if (!bookVariant) {
          throw new ForbiddenException(OrderMessage.BOOK_VARIANT_NOT_FOUND);
        }

        const unitPrice = Number(bookVariant.price);
        const lineTotal = unitPrice * item.quantity;

        subtotal += lineTotal;

        const contentHash = generateContentHash(bookVariant);

        const snapshot = await tx.bookVariantSnapshot.upsert({
          where: { contentHash },
          update: {},
          create: {
            bookVariantId: bookVariant.id,
            contentHash,
            priceSnapshot: unitPrice,
            formatSnapshot: bookVariant.format,
            skuSnapshot: generateSKU(bookVariant),
            titleSnapshot:
              bookVariant.book.translations?.[0]?.title ??
              item.variant.book.translations[0].title,
            coverImageUrlSnapshot: bookVariant.book.coverImageUrl ?? '',
            currencyCodeSnapshot: 'VND',
          },
        });

        await tx.orderItem.create({
          data: {
            orderId,
            bookVariantSnapshotId: snapshot.id,
            quantity: item.quantity,
            unitPrice,
            lineTotal,
          },
        });
      }),
    );
    await this.cartRepository.deleteByUserId(cart.userId);

    return subtotal;
  }

  /**
   * Tạo order cho người dùng khách
   * @param guestSessionId id của phiên guest
   * @param body thông tin về order
   * @param langId id ngôn ngữ
   *
   **/
  async createOrdersGuest(
    guestSessionId: string,
    body: CreateGuestOrdersAndPaymentDTO,
    langId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // tìm cart đầu tiên để thứ nhất vừa tính lại tiền
      // vừa hash cart để chặn không cho order tạo lại nhiều lần nếu cart ko thay đổi
      const cart = await tx.cart.findFirst({
        where: { guestSessionId },
        include: {
          items: {
            select: {
              id: true,
              cartId: true,
              bookVariantId: true,
              quantity: true,
              addedAt: true,
              variant: {
                include: {
                  book: {
                    include: {
                      translations: { select: { title: true, slug: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new ForbiddenException(OrderMessage.CART_NOT_FOUND);
      }

      // Đã fix logic sử dụng cartHash (tránh trường hợp 2 cart có dùng số sản phẩm giống nhau)
      const cartHash = this.getCartHash(cart?.items as CartItem[], cart.id);

      const existing = await tx.order.findFirst({
        where: { cartHash },
        include: {
          payments: {
            where: {
              status: {
                in: [
                  PaymentStatus.PENDING,
                  PaymentStatus.PAYMENT_OVERAGE,
                  PaymentStatus.PAYMENT_SHORTFALL,
                ],
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (cartHash === existing?.cartHash) {
        // Nếu bấm mà chưa tạo payment chỉ toàn kiểu tạo order (ko thanh toán) thì mình tiếng hành gửi lại cái mã mới mà không phải tạo lại order
        if (existing?.payments.length <= 0) {
          return {
            id: existing.id,
            subtotal: existing.subtotal,
            orderCode: existing.orderCode,
            payment: this.paymentService.createTransactionUrl({
              orderId: existing.id,
              gateway: PaymentGateway.SEPAY,
              amount: Number(existing.totalAmount),
            }),
            totalAmount: existing.totalAmount,
          };
        }
        return {
          id: existing.id,
          subtotal: existing.subtotal,
          orderCode: existing.orderCode,
          payment: existing.payments[0].paymentUrl,
          totalAmount: existing.payments[0].amount,
        };
      }

      // 3) Tạo order trước (chưa có subtotal chính xác cũng được, lát update)
      const order = await tx.order.create({
        data: {
          guestSessionId,
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
          currencyCode: 'VND',
          orderCode: generateOrderCode(),
          cartHash,
          shippingFee: SHIPPING_FEE,
          expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
        },
      });

      // 4) address
      await tx.orderAddress.create({
        data: {
          orderId: order.id,
          recipientName:
            body.orderAddress.firstName + ' ' + body.orderAddress.lastName,
          phoneNumber: body.orderAddress.phoneNumber,
          addressLine: body.orderAddress.addressLine,
          ward: body.orderAddress.ward,
          district: body.orderAddress.district,
          city: body.orderAddress.city,
          note: body.note,
        },
      });

      const subtotal = await this.processOrderItems(tx, cart, langId, order.id);

      // 6) update totals
      const totalAmount = subtotal + SHIPPING_FEE;
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          subtotal,
          totalAmount,
          discountAmount: 0,
          shippingFee: SHIPPING_FEE,
        },
      });

      if (body.paymentGateway === PaymentGateway.COD) {
        return {
          orderId: order.id,
          subtotal: updatedOrder.subtotal,
          totalAmount: updatedOrder.totalAmount,
          orderCode: order.orderCode,
        };
      }
      // Tạo transaction ở web hooks là tốt hơn (lúc trước là tạo ngay khi checkout)
      // - nhưng phát sinh ra chuyển sai tiền thì sẽ hiện các bản ghi null, không theo dõi chính xác người dùng chuyển tiền
      // 8) gọi gateway tạo transaction
      const gatewayResp = this.paymentService.createTransactionUrl({
        orderId: order.id,
        gateway: body.paymentGateway,
        amount: totalAmount,
      });

      return {
        orderId: order.id,
        subtotal: updatedOrder.subtotal,
        totalAmount: updatedOrder.totalAmount,
        paymentUrl: (gatewayResp as any)?.paymentUrl,
        orderCode: order.orderCode,
      };
    });
  }

  async createOrdersUser(
    userId: bigint,
    body: CreateUserOrdersAndPaymentDTO,
    langId: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const cartId = BigInt(body.cartId);
      const cart = await tx.cart.findFirst({
        where: { id: cartId, userId },
        include: {
          items: {
            select: {
              id: true,
              cartId: true,
              bookVariantId: true,
              quantity: true,
              addedAt: true,
              variant: {
                include: {
                  book: {
                    include: {
                      translations: { select: { title: true, slug: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!cart || cart.items.length === 0) {
        throw new ForbiddenException(OrderMessage.CART_NOT_FOUND);
      }

      // Đã fix logic sử dụng cartHash (tránh trường hợp 2 cart có dùng số sản phẩm giống nhau)
      const cartHash = this.getCartHash(cart?.items as CartItem[], cart.id);

      const existing = await tx.order.findFirst({
        where: { cartHash },
        include: {
          payments: {
            where: { status: PaymentStatus.PENDING },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (cartHash === existing?.cartHash) {
        return {
          id: existing.id,
          subtotal: existing.subtotal,
          orderCode: existing.orderCode,
          payment: existing.payments[0].paymentUrl,
          totalAmount: existing.payments[0].amount,
        };
      }

      let address: UserAddress | null = null;
      if (body.addressId !== undefined && body.addressId !== null) {
        address = await tx.userAddress.findFirst({
          where: { id: BigInt(body.addressId), userId, deletedAt: null },
        });
      } else {
        address = await tx.userAddress.findFirst({
          where: { userId, isDefault: true, deletedAt: null },
        });
        if (!address) {
          address = await tx.userAddress.findFirst({
            where: { userId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
          });
        }
      }

      if (!address)
        throw new ForbiddenException(OrderMessage.ADDRESS_NOT_FOUND);

      const order = await tx.order.create({
        data: {
          userId,
          addressId: address.id,
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
          currencyCode: 'VND',
          orderCode: generateOrderCode(),
          cartHash,
          shippingFee: SHIPPING_FEE,
          expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
        },
      });

      const subtotal = await this.processOrderItems(tx, cart, langId, order.id);
      const totalAmount = subtotal + SHIPPING_FEE;

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          subtotal,
          totalAmount,
          discountAmount: 0,
          shippingFee: SHIPPING_FEE,
        },
      });

      if (body.paymentGateway === PaymentGateway.COD) {
        console.log('Đã tạo order với phương thức COD');
        return {
          orderId: order.id,
          subtotal: updatedOrder.subtotal,
          totalAmount: updatedOrder.totalAmount,
          orderCode: order.orderCode,
        };
      }
      console.log('Đã tạo order, chuẩn bị tạo transaction');
      // Tạo transaction ở web hooks là tốt hơn (lúc trước là tạo ngay khi checkout)
      // - nhưng phát sinh ra chuyển sai tiền thì sẽ hiện các bản ghi null, không theo dõi chính xác người dùng chuyển tiền
      // 8) gọi gateway tạo transaction
      const gatewayResp = this.paymentService.createTransactionUrl({
        orderId: order.id,
        gateway: body.paymentGateway,
        amount: totalAmount,
      });

      return {
        orderId: order.id,
        subtotal: updatedOrder.subtotal,
        totalAmount: updatedOrder.totalAmount,
        paymentUrl: (gatewayResp as any)?.paymentUrl,
        orderCode: order.orderCode,
      };
    });
  }

  async getOrderGuest(sessionGuestId: string, page: number, limit: number) {
    return this.orderRepository.findOrderBySessionGuestId(
      sessionGuestId,
      page,
      limit,
    );
  }

  async getOrderDetailGuest(orderId: bigint, sessionGuestId: string, langId: number) {
    return this.orderItemRepository.findOrderDetailBySessionGuestId(orderId, sessionGuestId, langId);
  }

  async getOrderUser(userId: bigint, page: number, limit: number) {
    return this.orderRepository.findOrderByUserId(userId, page, limit);
  }

  async getOrderDetailUser(orderId: bigint, userId: bigint, langId: number) {
    return this.orderItemRepository.findOrderItemsByOrderId(
      orderId,
      userId,
      langId,
    );
  }
  async cleanOrder(orderSecondMinutes: number) {
    const expiredOrders =
      await this.orderRepository.findOrderIsExpire(orderSecondMinutes);
    const variantMap = new Map<string, number>();

    for (const order of expiredOrders) {
      for (const item of order.items) {
        const key = item.bookVariantSnapshot.bookVariantId.toString();
        variantMap.set(key, (variantMap.get(key) ?? 0) + item.quantity);
      }
    }
    return this.orderRepository.clearOrder(variantMap, orderSecondMinutes);
  }
}
