import { SePayHooksDto } from '@/modules/hooks/dto/request/sepay-hooks.dto';
import { PaymentRepository } from '@/modules/payment/payment.repository';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus, PaymentGateway } from '@prisma/client';
import { HooksRepository } from './hooks.repository';

@Injectable()
export class HooksService {
    constructor(private readonly hooksRepository: HooksRepository,
        private readonly paymentRepository: PaymentRepository
    ) { }

    async handleSepayWebhook(body: SePayHooksDto) {
        // Chống trùng lặp 
        const providerEventId = this.extractProviderEventId(body);
        if (!providerEventId) {
            throw new BadRequestException('Missing webhook event id');
        }

        const existedWebhook =
            await this.hooksRepository.findWebhookByProviderEventId(providerEventId);

        const webhookInbox =
            existedWebhook ??
            (await this.hooksRepository.saveSepayWebhook(providerEventId, body));

        if (webhookInbox.status === JobStatus.DONE) {
            return {
                ok: true,
                duplicate: true,
                providerEventId,
                webhookInboxId: webhookInbox.id.toString(),
                message: 'Webhook already processed',
            };
        }

        const attempts = (webhookInbox.attempts ?? 0) + 1;
        // Check mã định danh orderCode ở trong webhooks check chắn chắn tất cả trường hợp có thể có
        // khi tất cả đều không có thì là failed
        const normalizedOrderCode = this.extractNormalizedOrderCode(body);

        if (!normalizedOrderCode) {
            await this.hooksRepository.updateWebhookStatus(
                webhookInbox.id,
                JobStatus.FAILED,
                attempts,
                'Order code not found in webhook payload',
            );

            throw new BadRequestException('Order code not found in webhook payload');
        }

        // Tạo tìm order cũ đó xem có không
        const order =
            await this.hooksRepository.findOrderByNormalizedOrderCode(
                normalizedOrderCode,
            );

        // Nếu không JOB FAILED
        if (!order) {
            await this.hooksRepository.updateWebhookStatus(
                webhookInbox.id,
                JobStatus.FAILED,
                attempts,
                `Order not found for code: ${normalizedOrderCode}`,
            );

            throw new BadRequestException('Order not found');

        }
        if (!order?.subtotal) {
            throw new BadRequestException('Order not found');
        }

        if (body.transferAmount < Number(order?.subtotal) || body.transferAmount > Number(order?.subtotal)) {
            if (order.userId) {
                await this.paymentRepository.createPaymentTransaction(order.userId, {
                    orderId: order.id,
                    amount: body.transferAmount,
                    gateway: PaymentGateway.SEPAY,
                })
            } else if (order.guestSessionId) {
                await this.paymentRepository.createPaymentTransactionGuestId({
                    orderId: order.id,
                    amount: body.transferAmount,
                    gateway: PaymentGateway.SEPAY,
                })
            }

        }
        const paidOrder = await this.hooksRepository.markOrderAndPaymentSuccess(
            order.id,
            providerEventId,
            body,
        );
        const doneWebhook = await this.hooksRepository.updateWebhookStatus(
            webhookInbox.id,
            JobStatus.DONE,
            attempts,
        );

        return {
            ok: true,
            duplicate: Boolean(existedWebhook),
            providerEventId,
            normalizedOrderCode,
            webhookInboxId: doneWebhook.id.toString(),
            orderId: paidOrder.id.toString(),
            orderCode: paidOrder.orderCode,
            orderStatus: paidOrder.status,
            paymentStatus: paidOrder.paymentStatus,
        };
    }

    async getOrderStatus(orderIdText: string) {
        let order: Awaited<ReturnType<HooksRepository['findOrderStatusById']>> = null;
        if (/^\d+$/.test(orderIdText)) {
            order = await this.hooksRepository.findOrderStatusById(BigInt(orderIdText));
        }

        if (!order) {
            const normalizedOrderCode = orderIdText
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '');
            order = await this.hooksRepository.findOrderByNormalizedOrderCode(
                normalizedOrderCode,
            );
        }

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return {
            id: order.id.toString(),
            orderCode: order.orderCode,
            status: order.status,
            paymentStatus: order.paymentStatus,
            updatedAt: order.updatedAt,
        };
    }

    private extractProviderEventId(body: SePayHooksDto): string | null {
        const raw = body.id ?? body.referenceCode ?? body.code;
        if (raw === undefined || raw === null) return null;
        return raw.toString().trim();
    }

    private extractNormalizedOrderCode(body: SePayHooksDto): string | null {
        const candidates = [
            body.content,
            body.description,
            body.code,
            body.referenceCode,
        ];

        for (const candidate of candidates) {
            if (typeof candidate !== 'string') continue;
            const upper = candidate.toUpperCase();
            const matched = upper.match(/OD[-_\s]*\d{6}[-_\s]*[A-Z0-9]{6,}/);
            if (!matched?.[0]) continue;

            const normalized = matched[0].replace(/[^A-Z0-9]/g, '');
            if (normalized.startsWith('OD')) {
                return normalized;
            }
        }

        return null;
    }
}
