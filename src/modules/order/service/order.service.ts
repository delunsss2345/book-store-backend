import { SHIPPING_FEE } from '@/common';
import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
import { CACHE_REDIS } from '@/config/redis.config';
import { PrismaClientTransaction } from '@/database';
import { BookVariantService } from '@/modules/book/variant/service/bookVariant.service';
import { CreateCheckOutDTO } from '@/modules/order/dto/request/create-orders.dto';
import { OrderMapper } from '@/modules/order/mapper';
import { OrderItemRepository } from '@/modules/order/repository/order-item.repository';
import { OrderRepository } from '@/modules/order/repository/order.repository';
import { PaymentIntentService } from '@/modules/payment/service/payment-intent.service';
import { PaymentService } from '@/modules/payment/service/payment.service';
import { TransactionService } from '@/modules/transaction/service/transaction.service';
import { UserAddressService } from '@/modules/user/service/user-address.service';
import { CheckoutQueue } from '@/queue/checkout/checkout.queue';
import { generateOrderCode } from '@/utils/generateOrderCode.util';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  CartItem,
  CurrencyCode,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import crypto from 'crypto';
import Redis from 'ioredis';
import { CreateUrlPaymentResponseDTO } from '../../payment/dto/response/create-url-payment.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly paymentIntentService: PaymentIntentService,
    private readonly transactionService: TransactionService,
    private readonly userAddressService: UserAddressService,
    private readonly bookVariantService: BookVariantService,
    private readonly checkoutQueue: CheckoutQueue,
    @Inject(CACHE_REDIS) private readonly redis: Redis
  ) { }

  /**
   * Generates a hash string for the given cart items and cartId.
   *
   * @param items Cart items to generate the hash string from.
   * @param cartId Cart id to generate the hash string from.
   * @returns A hash string representing the given cart items and cartId.
   */
  getCartHash(items: CartItem[]) {
    const sortedItems = [...items].sort((a, b) =>
      a.id.toString().localeCompare(b.id.toString()),
    );

    const content = sortedItems
      .map((item) => `${item.bookVariantId}:${item.quantity}`)
      .join('|');

    return crypto.createHash('md5').update(content).digest('hex');
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
      currencyCode: CurrencyCode;
      shippingFee: number;
      expiredAt: Date;
    },
    tx: PrismaClientTransaction,
  ) {
    return this.orderRepository.createWithGuest(data, tx);
  }

  updateById(
    id: number,
    data: Prisma.OrderUncheckedUpdateInput,
    tx: PrismaClientTransaction,
  ) {
    return this.orderRepository.updateById(id, data, tx);
  }

  createGuestOrder(data: {
    guestSessionId: string;
    orderCode: string;
    totalAmount: number;
    subtotal: number;
  }) {
    return this.orderRepository.create({
      guestSessionId: data.guestSessionId,
      orderCode: data.orderCode,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      currencyCode: CurrencyCode.VND,
      shippingFee: SHIPPING_FEE,
      expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
      totalAmount: data.totalAmount,
      subtotal: data.subtotal,
    });
  }

  createUserOrder(data: {
    userId: number;
    orderCode: string;
    totalAmount: number;
    subtotal: number;
    addressId: number;
  }) {
    return this.orderRepository.create({
      userId: data.userId,
      orderCode: data.orderCode,
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      currencyCode: CurrencyCode.VND,
      shippingFee: SHIPPING_FEE,
      expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
      totalAmount: data.totalAmount,
      subtotal: data.subtotal,
      addressId: data.addressId,
    });
  }

  deleteOrder(orderId: number) {
    return this.orderRepository.deleteById(orderId);
  }

  async createCheckout(
    body: CreateCheckOutDTO,
    guestSessionId: string | null,
    userId: number | null,
  ) {

    const isGuest = body.isGuest;
    this.logger.log(
      `[createCheckout] START - isGuest=${isGuest}, userId=${userId}, items=${body.items.length}`,
    );

    let email: string | undefined;

    if (isGuest) {
      if (!guestSessionId)
        throw new BadRequestException('Bạn không phải là khách vãn lai');
      if (!body.guestAddress) throw new BadRequestException('Address required');
      this.logger.log(
        `[createCheckout] GUEST validation passed - guestSessionId=${guestSessionId}`,
      );
    } else {
      if (!body.addressId)
        throw new BadRequestException('Bạn cần phải tạo địa chỉ');

      const address = await this.userAddressService.findByAddressIdAndUserId(
        body.addressId,
        userId!,
      );
      if (!address) throw new BadRequestException('Bạn cần phải tạo địa chỉ');
      email = address.user.email;
      this.logger.log(
        `[createCheckout] USER validation passed - userId=${userId}, addressId=${body.addressId}, email=${email}`,
      );
    }

    const mapVariantIds: Record<number, number> = {};
    const items = body.items;

    items.forEach((i) => {
      mapVariantIds[i.bookVariantId] = i.quantity;

    });

    const variants = await this.bookVariantService.findByVariantIds(
      items.map((i) => i.bookVariantId),
    );

    if (variants.length !== items.length)
      throw new BadRequestException('Có sản phẩm đã bị xoá');

    let isError = false;
    try {
      const pipeline = this.redis.pipeline()
      for (const variant of variants) {
        pipeline.set(`available:${variant.id}`, variant.stock - variant.reserved, 'EX', 3600, "NX")
      }
      await pipeline.exec()

      // Query N + 1
      const luaScript = `
      local result = {}
      for i = 1, #KEYS do
        result[i] = redis.call('DECRBY', KEYS[i], ARGV[i])
      end
      return result
    `
      const keys = items.map(i => `available:${i.bookVariantId}`)
      const quantity = items.map(i => i.quantity.toString())

      let count = 0;
      const result = await this.redis.eval(luaScript, keys.length, ...keys, ...quantity) as number[]

      for (const _ of items) {
        const remaining = result[count++]
        if (remaining < 0) {
          await this.redis.incrby(keys[count], quantity[count])
          throw new BadRequestException('Hết hàng')
        }
      }
    }
    catch {
      isError = true;
      variants.forEach((v) => {
        if (v.stock - v.reserved <= 0) throw new BadRequestException('Hết hàng')
      })

      await this.transactionService.doInTransaction(async (tx) => {
        await this.bookVariantService.updateReservedByIds(items, tx);
      });
    }

    this.logger.log(
      `[createCheckout] Stock reserved for ${items.length} variant(s)`,
    );

    const subtotal = variants.reduce(
      (sum, v) => sum + Number(v.price) * mapVariantIds[v.id],
      0,
    );

    const totalAmount = subtotal + SHIPPING_FEE;
    const orderCode = generateOrderCode();

    const orderVariants = variants.map(
      ({ id, format, isbn, price, stock, isActive, edition }) => ({
        id,
        format,
        isbn,
        price,
        stock,
        isActive,
        edition,
      }),
    );
    const order = isGuest
      ? await this.createGuestOrder({ guestSessionId: guestSessionId!, orderCode, totalAmount, subtotal })
      : await this.createUserOrder({ userId: userId!, orderCode, totalAmount, subtotal, addressId: body.addressId! });
    const payment = body.paymentGateway
    let result: CreateUrlPaymentResponseDTO | undefined;
    if (payment !== PaymentGateway.COD) {
      result = this.paymentService.generateQrUrl(totalAmount, orderCode)

      await this.paymentIntentService.createPaymentIntent({
        gateway: PaymentGateway.SEPAY,
        orderCode,
        ...result,
      });
    }

    await this.checkoutQueue.enqueueCheckout({
      orderId: order.id,
      isGuest,
      orderCode,
      totalAmount,
      subtotal,
      variants: orderVariants,
      mapVariantIds,
      guestEmail: body.guestEmail,
      guestSessionId: isGuest ? guestSessionId! : undefined,
      guestAddress: isGuest ? body.guestAddress : undefined,
      addressId: !isGuest ? body.addressId : undefined,
      userId: !isGuest ? userId! : undefined,
      email,
      isError,
      payment
    });
    this.logger.log(`[createCheckout] Job enqueued - orderCode=${orderCode}`);

    return {
      isTransfer: payment !== PaymentGateway.COD,
      orderCode,
      totalAmount,
      orderVariants,
      shipFee: SHIPPING_FEE,
      ...(result || {})
    };
  }




  async getOrderGuest(sessionGuestId: string, page: number, limit: number) {
    const orders = await this.orderRepository.findOrderBySessionGuestId(
      sessionGuestId,
      page,
      limit,
    );

    return OrderMapper.toList(orders);
  }

  async getOrderDetailGuest(
    orderId: number,
    sessionGuestId: string,
    langId: number,
  ) {
    return this.orderItemRepository.findOrderDetailBySessionGuestId(
      orderId,
      sessionGuestId,
      langId,
    );
  }

  async getOrderUser(userId: number, page: number, limit: number) {
    const orders = await this.orderRepository.findOrderByUserId(
      userId,
      page,
      limit,
    );

    return OrderMapper.toList(orders);
  }

  async getOrderDetailUser(orderId: number, userId: number, langId: number) {
    return this.orderItemRepository.findOrderItemsByOrderId(
      orderId,
      userId,
      langId,
    );
  }

  async cleanOrder(orderSecondMinutes: number) {
    Logger.debug(
      `Bắt đầu dọn dẹp order đã hết hạn trước ${orderSecondMinutes} giây`,
      'OrderService',
    );

    const expiredOrders =
      await this.orderRepository.findOrderIsExpire(orderSecondMinutes);

    Logger.debug(
      `Tìm thấy ${expiredOrders.length} order đã hết hạn`,
      'OrderService',
    );
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
