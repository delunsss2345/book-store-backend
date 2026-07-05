import { SetMetadata } from '@nestjs/common';

export const IS_PAYMENT_KEY = 'isPayment';
export const Payment = () => SetMetadata(IS_PAYMENT_KEY, true);