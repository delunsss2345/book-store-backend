import { AppModule } from '@/app.module';
import { PaymentIntentWithUrlResponseDto } from '@/modules/payment/dto/response/payment-intent-url.response.dto';
import { Injectable } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { CreatePaymentIntentRequestDto } from '../dto/request/create-payment-intent.request.dto';
import {
  DeleteExpiredPaymentIntentResponseDto,
  PaymentIntentResponseDto,
} from '../dto/response';
import {
  toDeleteExpiredPaymentIntentResponse,
  toPaymentIntentAccountBankResponse,
  toPaymentIntentResponse,
} from '../mapper';
import { PaymentIntentRepository } from '../repository/payment-intent.repository';

const PAYMENT_INTENT_EXPIRES_IN_MS = 0.5 * 60 * 1000;

@Injectable()
export class PaymentIntentService {
  private readonly bank = AppModule.CONFIGURATION.PAYMENT_CONFIG.BANK_ID;
  private readonly stk = AppModule.CONFIGURATION.PAYMENT_CONFIG.ACCOUNT_NO;
  private readonly nameAccount =
    AppModule.CONFIGURATION.PAYMENT_CONFIG.NAME_RECEIVER;
  constructor(
    private readonly paymentIntentRepository: PaymentIntentRepository,

  ) { }

  async createPaymentIntent(
    dto: CreatePaymentIntentRequestDto,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentIntentResponseDto> {
    const paymentIntent =
      await this.paymentIntentRepository.create({
        orderId: dto.orderId,
        orderCode: dto.orderCode,
        content: dto.content,
        gateway: dto.gateway,
        paymentUrl: dto.paymentUrl,
        status: dto.status ?? PaymentStatus.PENDING,
        tokenUrl: dto.tokenUrl,
        expiredAt: dto.expiredAt ?? this.getDefaultExpiredAt(),
      }, tx);

    return toPaymentIntentResponse(paymentIntent);
  }

  async deleteExpiredPaymentIntents(
    cutoffAt: Date = new Date(),
  ): Promise<DeleteExpiredPaymentIntentResponseDto> {
    const result =
      await this.paymentIntentRepository.deleteExpiredPending(
        cutoffAt,
      );

    return toDeleteExpiredPaymentIntentResponse(result, cutoffAt);
  }

  private getDefaultExpiredAt(): Date {
    return new Date(Date.now() + PAYMENT_INTENT_EXPIRES_IN_MS);
  }

  async markPaymentIntentAsExpire(orderId: number) {
    await this.paymentIntentRepository.updateStatus(
      orderId,
      PaymentStatus.EXPIRED,
    );
  }

  async markPaymentIntentAsNotFound(orderId: number) {
    await this.paymentIntentRepository.updateStatus(
      orderId,
      PaymentStatus.NOT_FOUND_ORDER_CODE,
    );
  }

  async findByTokenUrl(tokenUrl: string): Promise<PaymentIntentWithUrlResponseDto | null> {
    const paymentIntent = await this.paymentIntentRepository.findByTokenUrl(tokenUrl);
    if (!paymentIntent) {
      return null;
    }
    return toPaymentIntentAccountBankResponse(paymentIntent, this.bank, this.stk, this.nameAccount);
  }

  async findByOrderCode(orderCode: string) {
    const paymentIntent = await this.paymentIntentRepository.findByOrderCode(orderCode);
    if (!paymentIntent) {
      return null;
    }
    return paymentIntent;
  }

  async findByContent(content: string) {
    const paymentIntent = await this.paymentIntentRepository.findByContent(content);
    if (!paymentIntent) {
      return null;
    }

    return paymentIntent;
  }
}
