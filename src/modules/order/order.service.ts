import { CreateGuestOrdersAndPaymentDTO } from "@/modules/order/dto/request/create-orders.dto";
import { generateContentHash } from "@/utils/generateContentHash.util";
import { generateSKU } from "@/utils/generateSku.util";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { BookSnapshotRepository } from "../book-snapshot/book-snapshot.repository";
import { CartRepository } from "../cart/cart.repository";
import { CatalogRepository } from "../catalog/catalog.repository";
import { OrderAddressRepository } from "../order-address/order-address.repository";
import { OrderItemRepository } from "../order-item/order-item.repository";
import { PaymentRepository } from "../payment/payment.repository";
import { PaymentService } from "../payment/payment.service";
import { OrderRepository } from './order.repository';

@Injectable()
export class OrderService {
    constructor(private readonly orderRepository: OrderRepository,
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentService: PaymentService,
        private readonly orderAddressRepository: OrderAddressRepository,
        private readonly orderItemRepository: OrderItemRepository,
        private readonly catalogRepository: CatalogRepository,
        private readonly cartRepository: CartRepository,
        private readonly bookSnapshotRepository: BookSnapshotRepository,
    ) { }

    async createOrdersGuest(guestSessionId: string, body: CreateGuestOrdersAndPaymentDTO) {
        const order = await this.orderRepository.createOrdersByGuestId(guestSessionId);
        const cart = await this.cartRepository.findByGuestSessionId(guestSessionId);

        if (!cart) {
            throw new ForbiddenException('Cart not found');
        }

        await this.orderAddressRepository.createGuestAddress(order.id, body.orderAddress, body.note);

        await Promise.all(
            cart.items.map(async (item) => {
                const bookVariant = await this.catalogRepository.findBookVariantById(
                    item.bookVariantId,
                    body.languageId,
                );

                if (!bookVariant) {
                    throw new ForbiddenException('Book variant not found');
                }

                if (!bookVariant.stock || bookVariant.stock < item.quantity) {
                    throw new ForbiddenException('Book variant out of stock');
                }

                // Tạo mã hash để sử dụng cho snapshot, check đã có thì không cần tạo lại
                const contentHash = generateContentHash(bookVariant);

                // Upsert snapshot
                const bookSnapshot = await this.bookSnapshotRepository.upsertBookSnapshot(
                    contentHash,
                    {
                        bookVariantId: item.bookVariantId.toString(),
                        contentHash,
                        priceSnapshot: Number(bookVariant.price),
                        formatSnapshot: bookVariant.format,
                        skuSnapshot: generateSKU(bookVariant),
                        titleSnapshot: item.variant.book.translations[0].title,
                        coverImageUrlSnapshot: item.variant.book.coverImageUrl ?? '',
                        currencyCodeSnapshot: item.variant.currencyCode ?? 'VN',
                    },
                );

                // Tạo order item
                await this.orderItemRepository.createOrderItem(
                    order.id,
                    bookSnapshot.id,
                    item.quantity,
                    Number(bookSnapshot.priceSnapshot),
                );
            }),
        );

        if (!order.totalAmount) return;

        await this.paymentRepository.createPaymentTransactionGuestId({
            orderId: order.id,
            gateway: body.paymentGateway,
            amount: order.totalAmount,
        });

        return this.paymentService.createTransaction({
            orderId: order.id,
            gateway: body.paymentGateway,
            amount: order.totalAmount,
        });
    }

    // async createOrdersUser(userId: bigint, body: CreateOrdersAndPaymentDTO) {
    //     const order = await this.orderRepository.createOrdersByUserId(userId);

    //     if (!order.totalAmount) return;

    //     return this.paymentRepository.createPaymentTransaction(userId, {
    //         orderId: order.id,
    //         gateway: body.paymentGateWay,
    //         amount: order.totalAmount
    //     })
    // }
}
