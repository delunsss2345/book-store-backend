import { SHIPPING_FEE } from "@/common";
import { ORDER_EXPIRED_SECONDS } from "@/common/constants/expired-constant";
import { PrismaService } from "@/database";
import { CreateGuestOrdersAndPaymentDTO } from "@/modules/order/dto/request/create-orders.dto";
import { generateContentHash } from "@/utils/generateContentHash.util";
import { generateOrderCode } from "@/utils/generateOrderCode.util";
import { generateSKU } from "@/utils/generateSku.util";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { CartItem, OrderStatus, PaymentStatus } from "@prisma/client";
import crypto from 'crypto';
import { CatalogRepository } from "../catalog/catalog.repository";
import { PaymentService } from "../payment/payment.service";
@Injectable()
export class OrderService {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly catalogRepository: CatalogRepository,
        private readonly prisma: PrismaService
    ) { }
    getCartHash(items: CartItem[]) {
        const sortedItems = items.sort((a, b) => (a.id.toString()).localeCompare((b.id.toString())));
        const content = sortedItems.map(item => `${item.bookVariantId}:${item.quantity}`).join("|");

        return crypto.createHash("md5").update(content).digest("hex");
    };

    async createOrdersGuest(guestSessionId: string, body: CreateGuestOrdersAndPaymentDTO) {
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


            const cartHash = this.getCartHash(cart?.items as CartItem[]);
            if (!cart || cart.items.length === 0) throw new ForbiddenException("Cart not found");

            const [language, existing] = await Promise.all([
                this.catalogRepository.findLanguageByCode(body.languageCode ?? "vi"),
                tx.order.findFirst({
                    where: { cartHash },
                    include: {
                        payments: {
                            where: { status: PaymentStatus.PENDING },
                            orderBy: { createdAt: "desc" },
                            take: 1,
                        }
                    }
                })
            ])
            if (cartHash === existing?.cartHash) {
                return {
                    id: existing.id,
                    subtotal: existing.subtotal,
                    orderCode: existing.orderCode,
                    payment: existing.payments[0].paymentUrl,
                    totalAmount: existing.payments[0].amount,
                }
            }

            // 2) Tính total dựa trên dữ liệu mới nhất (bookVariant)
            let subtotal = 0;

            // 3) Tạo order trước (chưa có subtotal chính xác cũng được, lát update)
            const order = await tx.order.create({
                data: {
                    guestSessionId,
                    status: OrderStatus.PENDING_PAYMENT,
                    paymentStatus: PaymentStatus.PENDING,
                    currencyCode: "VND",
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
                    (language?.id ?? 3) as any,
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
                    idempotencyKey: order.orderCode, // hoặc key khác cho payment attempt
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

            return { orderId: order.id, subtotal: updatedOrder.subtotal, totalAmount: updatedOrder.totalAmount, paymentUrl: (gatewayResp as any)?.paymentUrl, orderCode: order.orderCode };
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
