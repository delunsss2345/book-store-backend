import { PaymentIntentWithUrlResponseDto } from '@/modules/payment/dto/response/payment-intent-url.response.dto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, Prisma } from '@prisma/client';
import { CreatePaymentIntentRequestDto } from '../dto/request/create-payment-intent.request.dto';
import {
  DeleteExpiredPaymentIntentResponseDto
} from '../dto/response';
import {
  toDeleteExpiredPaymentIntentResponse,
  toPaymentIntentAccountBankResponse
} from '../mapper';
import { PaymentIntentRepository } from '../repository/payment-intent.repository';

export const PAYMENT_INTENT_EXPIRES_IN_MS = 60 * 60 * 1000;

@Injectable()
export class PaymentIntentService {
  private readonly bank: string;
  private readonly stk: string;
  private readonly nameAccount: string;

  constructor(
    private readonly paymentIntentRepository: PaymentIntentRepository,
    private readonly configService: ConfigService,
  ) {
    this.bank = this.configService.get<string>('BANK_ID')!;
    this.stk = this.configService.get<string>('ACCOUNT_NO')!;
    this.nameAccount = this.configService.get<string>('NAME_RECEIVER')!;
  }

  async createPaymentIntent(
    dto: CreatePaymentIntentRequestDto,
    tx?: Prisma.TransactionClient,
  ) {
    return this.paymentIntentRepository.create({
      orderCode: dto.orderCode,
      content: dto.content,
      gateway: dto.gateway,
      paymentUrl: dto.paymentUrl,
      tokenUrl: dto.tokenUrl,
      expiredAt: this.getDefaultExpiredAt(),
    }, tx);
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

  async markPaymentIntent(orderCode: string, status: PaymentStatus) {
    await this.paymentIntentRepository.updateStatus(orderCode, status);
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
  findStatusPayByOrderCode(orderCode: string) {
    return this.paymentIntentRepository.findPaymentByOrderCode(orderCode);
  }
} 
