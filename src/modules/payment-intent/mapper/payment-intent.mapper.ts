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
    expiredAt: paymentIntent.expiredAt,
    createdAt: paymentIntent.createdAt,
    updatedAt: paymentIntent.updatedAt,
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
