import { OrderMessage, SHIPPING_FEE } from '@/common';
import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
import { PrismaClientTransaction } from '@/database';
import { BookVariantSnapshotService } from '@/modules/book/snapshot/service/book-snapshot.service';
import { BookVariantService } from '@/modules/book/variant/service/bookVariant.service';
import { EmailOutboxService } from '@/modules/email-outbox/service/email-outbox.service';
import { CreateCheckOutDTO } from '@/modules/order/dto/request/create-orders.dto';
import { OrderItemRepository } from '@/modules/order/repository/order-item.repository';
import { OrderRepository } from '@/modules/order/repository/order.repository';
import { OrderAddressService } from '@/modules/order/service/order-address.service';
import { OrderItemService } from '@/modules/order/service/order-item.service';
import { PaymentIntentService } from '@/modules/payment/service/payment-intent.service';
import { PaymentService } from '@/modules/payment/service/payment.service';
import { TransactionService } from '@/modules/transaction/service/transaction.service';
import { UserAddressService } from '@/modules/user/service/user-address.service';
import { EmailQueue } from '@/queue/email/email.queue';
import { generateContentHash } from '@/utils/generateContentHash.util';
import { generateOrderCode } from '@/utils/generateOrderCode.util';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  CartItem,
  CurrencyCode,
  Order,
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
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly emailQueue: EmailQueue,
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

  // Xử lí orderItems
  // Optimize from N + 1 queries to 5 queries
  private async processOrderItems(tx: any, items: any) {
    const mapVariantIds = new Map<number, number>();
    items.forEach((i) => {
      mapVariantIds.set(i.bookVariantId, i.quantity);
    });
    const variants = await this.bookVariantService.findByVariantIds([
      ...mapVariantIds.keys(),
    ]);

    variants.forEach((v) => {
      const variantCardItem = mapVariantIds.get(v.id);
      const quantity = mapVariantIds.get(v.id);
      const available = v ? v.stock - v.reserved : 0;

      if (!v) throw new ForbiddenException(OrderMessage.BOOK_VARIANT_NOT_FOUND);

      if (!v.stock || available < (quantity ?? 0)) {
        Logger.error(
          `Book variant ${v.id} out of stock. Available: ${available}, Required: ${quantity ?? 0}`,
        );
        throw new ForbiddenException(
          OrderMessage.BOOK_OUT_OF_STOCK('Sản phẩm vừa hết hàng'),
        );
      }
    });

    let subtotal = 0;
    const snapshots: {
      bookVariantSnapshotId: number;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];
    await Promise.all(
      variants.map(async (variant) => {
        const quantity = mapVariantIds.get(variant.id)!;
        const unitPrice = Number(variant.price);
        const lineTotal = unitPrice * mapVariantIds.get(variant.id)!;

        subtotal += lineTotal;

        const contentHash = generateContentHash({
          id: variant.id,
          format: variant.format,
          price: Number(variant.price),
          isbn: variant.isbn,
        });

        const [snapshot, _] = await Promise.all([
          this.bookVariantSnapshotService.upsertByContentHash(
            contentHash,
            {
              bookVariantId: variant.id,
              contentHash,
              priceSnapshot: unitPrice,
              formatSnapshot: variant.format,
            },
            tx,
          ),
          this.bookVariantService.updateReservedById(variant.id, quantity, tx),
        ]);

        snapshots.push({
          bookVariantSnapshotId: snapshot.id,
          quantity,
          unitPrice,
          lineTotal,
        });
      }),
    );

    return {
      subtotal,
      snapshots,
    };
  }

  async createCheckout(
    body: CreateCheckOutDTO,
    guestSessionId: string | null,
    userId: number | null,
  ) {
    return this.transactionService.doInTransaction(async (tx) => {
      const isGuest = body?.isGuest;
      let order: Order | undefined;
      let totalAmount = 0;
      let email: string | undefined | null;

      if (isGuest) {
        if (!guestSessionId)
          throw new BadRequestException('Bạn không phải là khách vãn lai');
        if (!body.guestAddress)
          throw new BadRequestException('Address required');
        const guestAddress = body.guestAddress;
        const mapVariantIds = new Map<number, number>();
        const items = body.items;
        items.forEach((i) => {
          mapVariantIds.set(i.bookVariantId, i.quantity);
        });
        const variants = await this.bookVariantService.findByVariantIds([
          ...mapVariantIds.keys(),
        ]);
        if (variants.length !== items.length)
          throw new BadRequestException('Có sản phẩm đã bị xoá');
        variants.forEach((v) => {
          if (v.stock - v.reserved === 0)
            throw new BadRequestException('Hết hàng');
        });
        await this.bookVariantService.updateReservedByIds(items, tx);

        // const { subtotal, snapshots } = await this.processOrderItems(tx, body.items);
        // totalAmount = subtotal + SHIPPING_FEE;
        // order = await this.orderRepository.create({
        //   guestSessionId,
        //   status: OrderStatus.PENDING_PAYMENT,
        //   paymentStatus: PaymentStatus.PENDING,
        //   currencyCode: CurrencyCode.VND,
        //   orderCode: generateOrderCode(),
        //   shippingFee: SHIPPING_FEE,
        //   expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
        //   totalAmount,
        //   subtotal,
        // }, tx);

        // await this.orderItemService.createMany(
        //   order.id,
        //   snapshots,
        //   tx,
        // );

        // await this.orderAddressService.create({
        //   orderId: order.id,
        //   recipientName: guestAddress.name,
        //   phoneNumber: guestAddress.phoneNumber,
        //   addressLine: guestAddress.addressLine,
        //   ward: guestAddress.ward,
        //   district: guestAddress.district,
        //   city: guestAddress.city,
        //   countryCode: 'VN',
        //   note: guestAddress.note,
        // }, tx);

        // email = body.guestEmail;
      } else if (userId) {
        if (!body.addressId)
          throw new BadRequestException('Bạn cần phải tạo địa chỉ');
        const addressId = body.addressId;

        const address = await this.userAddressService.findByAddressIdAndUserId(
          addressId,
          userId,
          tx,
        );
        if (!address) throw new BadRequestException('Bạn cần phải tạo địa chỉ');

        const { subtotal } = await this.processOrderItems(tx, body.items);
        totalAmount = subtotal + SHIPPING_FEE;
        order = await this.orderRepository.create(
          {
            userId,
            status: OrderStatus.PENDING_PAYMENT,
            paymentStatus: PaymentStatus.PENDING,
            currencyCode: CurrencyCode.VND,
            orderCode: generateOrderCode(),
            shippingFee: SHIPPING_FEE,
            expiredAt: new Date(Date.now() + ORDER_EXPIRED_SECONDS * 1000),
            totalAmount,
            subtotal,
            addressId,
          },
          tx,
        );

        email = address.user.email;
      }

      if (!order) throw new BadRequestException('Không thể tạo đơn hàng');

      if (body.paymentGateway === PaymentGateway.COD) {
        if (email) {
          const outbox = await this.emailOutbox.createOutboxOrderEmail({
            orderId: order.id,
            orderCode: order.orderCode,
            orderStatus: order.status ?? OrderStatus.PENDING_PAYMENT,
            toEmail: email,
          });
          await this.emailQueue.enqueueOrderEmail(outbox.id);
        }
        return {
          orderId: order.id,
          subtotal: order.subtotal,
          totalAmount: order.totalAmount,
          orderCode: order.orderCode,
        };
      }

      Logger.log(`Đã tạo order: ${JSON.stringify(order)}`);

      const gatewayResp = this.paymentService.createTransactionUrl({
        orderId: order.id,
        gateway: body.paymentGateway,
        amount: totalAmount,
      });

      Logger.log(`Đã tạo gatewayResp: ${JSON.stringify(gatewayResp)}`);

      return this.paymentIntent.createPaymentIntent(
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
    });
  }

  async getOrderGuest(sessionGuestId: string, page: number, limit: number) {
    return this.orderRepository.findOrderBySessionGuestId(
      sessionGuestId,
      page,
      limit,
    );
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
