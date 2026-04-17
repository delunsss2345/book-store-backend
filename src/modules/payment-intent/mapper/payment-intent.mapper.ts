import { PaymentIntentWithTotalAmountResponseDto } from '@/modules/payment-intent/dto/response/payment-intent-url.response.dto';
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

export function toPaymentIntentWithTotalAmountResponse(
  paymentIntent: any,
): PaymentIntentWithTotalAmountResponseDto {
  return {
    id: paymentIntent.id,
    orderId: paymentIntent.orderId.toString(),
    gateway: paymentIntent.gateway,
    status: paymentIntent.status,
    totalAmount: paymentIntent.totalAmount,
    tokenUrl: paymentIntent.tokenUrl,
  };
}
