import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { CreatePaymentIntentRequestDto } from './dto/request';
import {
  DeleteExpiredPaymentIntentResponseDto,
  PaymentIntentResponseDto,
} from './dto/response';
import {
  toDeleteExpiredPaymentIntentResponse,
  toPaymentIntentResponse,
} from './mapper';
import { PaymentIntentRepository } from './payment-intent.repository';

const PAYMENT_INTENT_EXPIRES_IN_MS = 5 * 60 * 1000;

@Injectable()
export class PaymentIntentService {
  constructor(
    private readonly paymentIntentRepository: PaymentIntentRepository,
  ) { }

  async createPaymentIntent(
    dto: CreatePaymentIntentRequestDto,
  ): Promise<PaymentIntentResponseDto> {
    const paymentIntent =
      await this.paymentIntentRepository.create({
        orderId: dto.orderId,
        gateway: dto.gateway,
        status: dto.status ?? PaymentStatus.PENDING,
        expiredAt: dto.expiredAt ?? this.getDefaultExpiredAt(),
      });

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
}
