import { PaymentIntentWithUrlResponseDto } from '@/modules/payment-intent/dto/response/payment-intent-url.response.dto';
import {
  DeleteExpiredPaymentIntentResponseDto,
  PaymentIntentResponseDto,
} from '../dto/response';

export function toPaymentIntentResponse(
  paymentIntent: any,
): PaymentIntentResponseDto {
  return {
    id: paymentIntent.id,
    orderId: paymentIntent.orderId.toString(),
    gateway: paymentIntent.gateway,
    status: paymentIntent.status,
    tokenUrl: paymentIntent.tokenUrl,
  };
}

export function toDeleteExpiredPaymentIntentResponse(
  result: any,
  cutoffAt: Date,
): DeleteExpiredPaymentIntentResponseDto {
  return {
    deletedCount: result.count,
    cutoffAt,
  };
}

export function toPaymentIntentAccountBankResponse(
  paymentIntent: any,
  bankName = 'MB Bank',
  stk = '17979220797979',
  nameAccount = 'Phạm Thanh Huy',
): PaymentIntentWithUrlResponseDto {
  return {
    id: paymentIntent.id,
    orderId: paymentIntent.orderId.toString(),
    gateway: paymentIntent.gateway,
    orderCode: paymentIntent.orderCode,
    status: paymentIntent.status,
    paymentUrl: paymentIntent.paymentUrl,
    tokenUrl: paymentIntent.tokenUrl,
    totalAmount: paymentIntent.order.totalAmount,
    bankName,
    stk,
    nameAccount
  };
}
