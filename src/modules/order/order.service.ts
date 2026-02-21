import { SHIPPING_FEE } from "@/common";
import { PrismaService } from "@/database";
import { CreateGuestOrdersAndPaymentDTO } from "@/modules/order/dto/request/create-orders.dto";
import { generateContentHash } from "@/utils/generateContentHash.util";
import { generateOrderCode } from "@/utils/generateOrderCode.util";
import { generateSKU } from "@/utils/generateSku.util";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { CatalogRepository } from "../catalog/catalog.repository";
import { PaymentService } from "../payment/payment.service";

@Injectable()
export class OrderService {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly catalogRepository: CatalogRepository,
        private readonly prisma: PrismaService
    ) { }

    async createOrdersGuest(guestSessionId: string, body: CreateGuestOrdersAndPaymentDTO) {
        return this.prisma.$transaction(async (tx) => {
            if (!body.idempotencyKey) throw new ForbiddenException("Missing idempotencyKey");

            const existing = await tx.order.findUnique({
                where: { idempotencyKey: body.idempotencyKey },
                include: {
                    payments: {
                        where: { status: PaymentStatus.PENDING },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                }
            });
            if (existing && existing.status !== OrderStatus.PENDING_PAYMENT) {
                throw new ForbiddenException("Order is not pending payment");
            }
            if (existing) {
                const lastPayment = existing.payments?.[0];

                const paymentUrl = lastPayment?.paymentUrl ?? "";
                return { orderCode: existing.orderCode, totalAmount: existing.totalAmount, paymentUrl };
            }

            const [lang, cart] = await Promise.all([
                this.catalogRepository.findLanguageByCode(body.languageCode ?? "vi"),
                tx.cart.findFirst({
                    where: { guestSessionId },
                    include: {
                        items: {
                            include: { variant: { include: { book: { include: { translations: true } } } } },
                        },
                    },
                }),
            ]);

            if (!cart || cart.items.length === 0) throw new ForbiddenException("Cart not found");

            // 2) Tính total dựa trên dữ liệu mới nhất (bookVariant)
            let subtotal = 0;

            // 3) Tạo order trước (chưa có subtotal chính xác cũng được, lát update)
            const order = await tx.order.create({
                data: {
                    guestSessionId,
                    status: OrderStatus.PENDING_PAYMENT,
                    paymentStatus: PaymentStatus.PENDING,
                    idempotencyKey: body.idempotencyKey,
                    currencyCode: "VND",
                    orderCode: generateOrderCode(), // MVP
                },
            });

            // 4) address
            await tx.orderAddress.create({
                data: {
                    orderId: order.id,
                    recipientName: body.orderAddress.firstName + ' ' + body.orderAddress.lastName,
                    phoneNumber: body.orderAddress.phoneNumber,
                    addressLine: body.orderAddress.addressLine,
                    ward: body.orderAddress.ward,
                    district: body.orderAddress.district,
                    city: body.orderAddress.city,
                    note: body.note,
                },
            });

            // 5) tạo items + snapshot + subtotal
            for (const item of cart.items) {
                const bookVariant = await this.catalogRepository.findBookVariantById(
                    item.bookVariantId,
                    (lang?.id ?? 3) as any,
                );

                if (!bookVariant) throw new ForbiddenException("Book variant not found");
                if (!bookVariant.stock || bookVariant.stock < item.quantity) {
                    throw new ForbiddenException("Book variant out of stock");
                }

                const unitPrice = Number(bookVariant.price);
                const lineTotal = unitPrice * item.quantity;
                subtotal += lineTotal;

                const contentHash = generateContentHash(bookVariant);

                const bookSnapshot = await tx.bookVariantSnapshot.upsert({
                    where: { contentHash },
                    update: {},
                    create: {
                        bookVariantId: BigInt(item.bookVariantId),
                        contentHash,
                        priceSnapshot: unitPrice,
                        formatSnapshot: bookVariant.format,
                        skuSnapshot: generateSKU(bookVariant),
                        titleSnapshot: bookVariant.book.translations?.[0]?.title ?? item.variant.book.translations[0].title,
                        coverImageUrlSnapshot: bookVariant.book.coverImageUrl ?? "",
                        currencyCodeSnapshot: "VND"
                    },
                });

                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        bookVariantSnapshotId: bookSnapshot.id,
                        quantity: item.quantity,
                        unitPrice: unitPrice,
                        lineTotal: lineTotal,
                    },
                });
            }

            // 6) update totals
            const totalAmount = subtotal + SHIPPING_FEE;
            const updatedOrder = await tx.order.update({
                where: { id: order.id },
                data: { subtotal, totalAmount, discountAmount: 0, shippingFee: SHIPPING_FEE },
            });

            // 7) tạo paymentTransaction PENDING
            const paymentTxn = await tx.paymentTransaction.create({
                data: {
                    orderId: order.id,
                    gateway: body.paymentGateway,
                    status: PaymentStatus.PENDING,
                    amount: totalAmount,
                    currencyCode: "VND",
                    idempotencyKey: body.idempotencyKey, // hoặc key khác cho payment attempt
                },
            });

            // 8) gọi gateway tạo transaction
            const gatewayResp = this.paymentService.createTransaction({
                orderId: order.id,
                gateway: body.paymentGateway,
                amount: totalAmount,
            });

            // 9) lưu response payload để retry trả lại paymentUrl
            await tx.paymentTransaction.update({
                where: { id: paymentTxn.id },
                data: {
                    responsePayload: gatewayResp as any,
                    paymentUrl: gatewayResp.paymentUrl,
                    providerTxnId: (gatewayResp as any)?.providerTxnId ?? null,
                },
            });

            return { orderId: order.id, totalAmount: updatedOrder.totalAmount, paymentUrl: (gatewayResp as any)?.paymentUrl, orderCode: order.orderCode };
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
