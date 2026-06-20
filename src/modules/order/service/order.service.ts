import { OrderMessage, SHIPPING_FEE } from '@/common';
import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
import { PrismaClientTransaction, PrismaService } from '@/database';
import { CatalogService } from '@/modules/book/catalog/service/catalog.service';
import { BookVariantSnapshotService } from '@/modules/book/snapshot/service/book-snapshot.service';
import { BookVariantService } from '@/modules/book/variant/service/bookVariant.service';
import { CartService } from '@/modules/cart/service/cart.service';
import { EmailOutboxService } from '@/modules/email-outbox/service/email-outbox.service';
import { EmailProducer } from '@/modules/jobs/producers/email.producer';
import {
  CreateGuestOrdersAndPaymentDTO,
  CreateUserOrdersAndPaymentDTO,
} from '@/modules/order/dto/request/create-orders.dto';
import { OrderItemRepository } from '@/modules/order/repository/order-item.repository';
import { OrderRepository } from '@/modules/order/repository/order.repository';
import { OrderAddressService } from '@/modules/order/service/order-address.service';
import { OrderItemService } from '@/modules/order/service/order-item.service';
import { PaymentIntentService } from '@/modules/payment/service/payment-intent.service';
import { PaymentService } from '@/modules/payment/service/payment.service';
import { TransactionService } from '@/modules/transaction/service/transaction.service';
import { UserAddressService } from '@/modules/user/service/user-address.service';
import { generateContentHash } from '@/utils/generateContentHash.util';
import { generateOrderCode } from '@/utils/generateOrderCode.util';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import {
  CartItem,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import crypto from 'crypto';

@Injectable()
export class OrderService {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly catalogService: CatalogService,
    private readonly orderRepository: OrderRepository,
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly emailProducer: EmailProducer,
    private readonly emailOutbox: EmailOutboxService,
    private readonly paymentIntent: PaymentIntentService,
    private readonly transactionService: TransactionService,
    private readonly userAddressService: UserAddressService,
    private readonly bookVariantSnapshotService: BookVariantSnapshotService,
    private readonly orderItemService: OrderItemService,
    private readonly bookVariantService: BookVariantService,
    private readonly orderAddressService: OrderAddressService,
  ) { }

  /**
   * Generates a hash string for the given cart items and cartId.
   *
   * @param items Cart items to generate the hash string from.
   * @param cartId Cart id to generate the hash string from.
   * @returns A hash string representing the given cart items and cartId.
   */
  getCartHash(items: CartItem[], cartId: number) {
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

  findByCartHash(cartHash: string, tx: PrismaClientTransaction) {
    return this.orderRepository.findByCartHash(cartHash, tx);
  }

  findOrderNotSuccessByCartHash(cartHash: string, tx: PrismaClientTransaction) {
    return this.orderRepository.findOrderNotSuccessByCartHash(cartHash, tx);
  }

  create(data: Prisma.OrderUncheckedCreateInput, tx: PrismaClientTransaction) {
    return this.orderRepository.create(data, tx);
  }

  createWithGuest(
    data: {
      guestSessionId: string;
      cartHash: string;
      orderCode: string;
      status: OrderStatus;
      paymentStatus: PaymentStatus;
      currencyCode: string;
      shippingFee: number;
      expiredAt: Date;
    },
    tx: PrismaClientTransaction,
  ) {
    return this.orderRepository.createWithGuest(data, tx);
  }

  updateById(id: number, data: Prisma.OrderUncheckedUpdateInput, tx: PrismaClientTransaction) {
    return this.orderRepository.updateById(id, data, tx);
  }

  // Xử lí orderItems
  // Optimize from N + 1 queries to 5 queries
  private async processOrderItems(
    tx: any,
    cart: any,
    orderId: number,
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

    const bookVariants = await this.catalogService.findBookVariantByIds(
      [...mapBookVariant.keys()].map((id) => Number(id)),
    );

    const variantMap = new Map(bookVariants.map((v) => [v.id.toString(), v]));

    bookVariants.forEach((v) => {
      const variantCardItem = mapBookVariant.get(v.id.toString());
      const variant = variantMap.get(v.id.toString());
      const available = variant ? variant.stock! - variant.reserved! : 0;

      if (!v) throw new ForbiddenException(OrderMessage.BOOK_VARIANT_NOT_FOUND);

      if (!v.stock || available < (variantCardItem?.quantity ?? 0)) {
        Logger.error(
          `Book variant ${v.id} out of stock. Available: ${available}, Required: ${variantCardItem?.quantity ?? 0}`,
        );
        throw new ForbiddenException(
          OrderMessage.BOOK_OUT_OF_STOCK(
            "Sản phẩm vừa hết hàng"
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

        const snapshot = await this.bookVariantSnapshotService.upsertByContentHash(
          contentHash,
          {
            bookVariantId: bookVariant.id.toString(),
            contentHash,
            priceSnapshot: unitPrice,
            formatSnapshot: bookVariant.format,
            currencyCodeSnapshot: bookVariant.currencyCode ?? 'VND',
          },
          tx,
        );

        await this.orderItemService.create(
          {
            orderId,
            bookVariantSnapshotId: snapshot.id,
            quantity: item.quantity,
            unitPrice,
            lineTotal,
          },
          tx,
        );

        await this.bookVariantService.updateReservedById(bookVariant.id, item.quantity, tx);
      }),
    );
    await this.cartService.deleteByUserId(cart.userId);

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
  ) {
    return this.transactionService.doInTransaction(async (tx) => {
      const cart = await this.cartService.findByGuestSessionId(guestSessionId, tx);

      if (!cart || cart.items.length === 0) {
        throw new ForbiddenException(OrderMessage.CART_NOT_FOUND);
      }

      const cartHash = this.getCartHash(cart?.items as CartItem[], cart.id);
      const existing = await this.findOrderNotSuccessByCartHash(cartHash, tx);

      if (cartHash === existing?.cartHash) {
        // Nếu bấm mà chưa tạo payment chỉ toàn kiểu tạo order (ko thanh toán) thì mình tiếng hành gửi lại cái mã mới mà không phải tạo lại order
        if (existing?.payments.length <= 0) {
          const gatewayResp = this.paymentService.createTransactionUrl({
            orderId: existing.id,
            gateway: PaymentGateway.SEPAY,
            amount: Number(existing.totalAmount),
          });

          await this.paymentIntent.createPaymentIntent(
            {
              orderId: existing.id,
              gateway: PaymentGateway.SEPAY,
              orderCode: existing.orderCode,
              tokenUrl: gatewayResp.result.token,
              paymentUrl: gatewayResp.result.url,
              content: gatewayResp.result.content,
              status: PaymentStatus.PENDING,
            },
            tx,
          );

          return {
            id: existing.id,
            subtotal: existing.subtotal,
            orderCode: existing.orderCode,
            payment: gatewayResp,
            totalAmount: existing.totalAmount,
          };
        }

        const gatewayResp = this.paymentService.createTransactionUrl({
          orderId: existing.id,
          gateway: PaymentGateway.SEPAY,
          amount: Number(existing.totalAmount),
        });

        await this.paymentIntent.createPaymentIntent(
          {
            orderId: existing.id,
            gateway: PaymentGateway.SEPAY,
            orderCode: existing.orderCode,
            tokenUrl: gatewayResp.result.token,
            paymentUrl: gatewayResp.result.url,
            content: gatewayResp.result.content,
            status: PaymentStatus.PENDING,
          },
          tx,
        );

        return {
          id: existing.id,
          payment: gatewayResp,
          orderCode: existing.orderCode,
        };
      }

      const order = await this.createWithGuest(
        {
          guestSessionId,
          status: OrderStatus.PENDING_PAYMENT,
          paymentStatus: PaymentStatus.PENDING,
          currencyCode: 'VND',
          orderCode: generateOrderCode(),
          cartHash,
          shippingFee: SHIPPING_FEE,
          expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
        },
        tx,
      );

      await this.orderAddressService.createWithGuest(order.id, body.orderAddress, body.note, tx);

      const subtotal = await this.processOrderItems(tx, cart, order.id);
      const totalAmount = subtotal + SHIPPING_FEE;

      const updatedOrder = await this.updateById(
        order.id,
        {
          subtotal,
          totalAmount,
          discountAmount: 0,
          shippingFee: SHIPPING_FEE,
        },
        tx,
      );

      if (body.paymentGateway === PaymentGateway.COD) {
        if (body.guestEmail) {
          const outbox = await this.emailOutbox.createOutboxOrderEmail({
            orderId: order.id,
            orderCode: order.orderCode,
            orderStatus: order.status ?? OrderStatus.PENDING_PAYMENT,
            toEmail: body.guestEmail,
          });
          await this.emailProducer.enqueueOrderEmail(outbox.id);
        }
        return {
          orderId: order.id,
          subtotal: updatedOrder.subtotal,
          totalAmount: updatedOrder.totalAmount,
          orderCode: order.orderCode,
        };
      }
      Logger.log(`Đã tạo order: ${JSON.stringify(updatedOrder)}`);

      const gatewayResp = this.paymentService.createTransactionUrl({
        orderId: updatedOrder.id,
        gateway: body.paymentGateway,
        amount: totalAmount,
      });

      Logger.log(`Đã tạo gatewayResp: ${JSON.stringify(gatewayResp)}`);

      return this.paymentIntent.createPaymentIntent({
        orderId: updatedOrder.id,
        gateway: body.paymentGateway,
        orderCode: order.orderCode,
        tokenUrl: gatewayResp.result.token,
        paymentUrl: gatewayResp.result.url,
        content: gatewayResp.result.content,
        status: PaymentStatus.PENDING,
      }, tx);
    });
  }

  async createOrdersUser(
    userId: number,
    body: CreateUserOrdersAndPaymentDTO,
  ) {
    return this.transactionService.doInTransaction(async (tx) => {
      const cartId = Number(body.cartId);
      const cart = await this.cartService.findByCartIdAndUserId(cartId, userId, tx);

      if (!cart || cart.items.length === 0) {
        throw new ForbiddenException(OrderMessage.CART_NOT_FOUND);
      }

      // Đã fix logic sử dụng cartHash (tránh trường hợp 2 cart có dùng số sản phẩm giống nhau)
      const cartHash = this.getCartHash(cart?.items as CartItem[], cart.id);
      const existing = await this.findByCartHash(cartHash, tx);

      if (cartHash === existing?.cartHash) {
        return {
          id: existing.id,
          subtotal: existing.subtotal,
          orderCode: existing.orderCode,
          payment: existing.payments[0].paymentUrl,
          totalAmount: existing.payments[0].amount,
        };
      }

      const address = await this.userAddressService.findByAddressIdAndUserId(
        Number(body.addressId),
        userId,
        tx,
      );

      if (!address)
        throw new ForbiddenException(OrderMessage.ADDRESS_NOT_FOUND);

      const order = await this.create(
        {
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
        tx,
      );

      const subtotal = await this.processOrderItems(tx, cart, order.id);
      const totalAmount = subtotal + SHIPPING_FEE;

      const updatedOrder = await this.updateById(
        order.id,
        {
          subtotal,
          totalAmount,
          discountAmount: 0,
          shippingFee: SHIPPING_FEE,
        },
        tx,
      );

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

      const paymentIntent = await this.paymentIntent.createPaymentIntent(
        {
          orderId: order.id,
          gateway: body.paymentGateway,
          orderCode: order.orderCode,
          tokenUrl: gatewayResp.result.token,
          paymentUrl: gatewayResp.result.url,
          content: gatewayResp.result.content,
          status: PaymentStatus.PENDING,
        },
        tx,
      );

      return {
        orderId: order.id,
        subtotal: updatedOrder.subtotal,
        totalAmount: updatedOrder.totalAmount,
        payment: paymentIntent,
        paymentUrl: gatewayResp.result.url,
        paymentContent: gatewayResp.result.content,
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

  async getOrderDetailGuest(orderId: number, sessionGuestId: string, langId: number) {
    return this.orderItemRepository.findOrderDetailBySessionGuestId(orderId, sessionGuestId, langId);
  }

  async getOrderUser(userId: number, page: number, limit: number) {
    return this.orderRepository.findOrderByUserId(userId, page, limit);
  }

  async getOrderDetailUser(orderId: number, userId: number, langId: number) {
    return this.orderItemRepository.findOrderItemsByOrderId(
      orderId,
      userId,
      langId,
    );
  }

  async cleanOrder(orderSecondMinutes: number) {
    Logger.debug(`Bắt đầu dọn dẹp order đã hết hạn trước ${orderSecondMinutes} giây`, 'OrderService');

    const expiredOrders =
      await this.orderRepository.findOrderIsExpire(orderSecondMinutes);

    Logger.debug(`Tìm thấy ${expiredOrders.length} order đã hết hạn`, 'OrderService');
    if (expiredOrders.length === 0) {
      return { cleanedCount: 0 };
    }
    const variantMap = new Map<string, number>();

    for (const order of expiredOrders) {
      for (const item of order.items) {
        const key = item.bookVariantSnapshot.bookVariantId.toString();
        variantMap.set(key, (variantMap.get(key) ?? 0) + item.quantity);
      }
    }
    return this.orderRepository.clearOrder(variantMap, orderSecondMinutes);
  }

  // Cho phép domain khác (vd HooksService) truy cập order qua service thay vì repository.
  // Nhận tx để giữ nguyên transaction của bên gọi.
  findOrderItemWWithParentVariantByOrderId(
    orderId: number,
    tx?: PrismaClientTransaction,
  ) {
    return this.orderRepository.findOrderItemWWithParentVariantByOrderId(
      orderId,
      tx,
    );
  }

  updateOrderDone(
    variantMap: Map<string, number>,
    orderId: number,
    tx?: PrismaClientTransaction,
  ) {
    return this.orderRepository.updateOrderDone(variantMap, orderId, tx);
  }
}
