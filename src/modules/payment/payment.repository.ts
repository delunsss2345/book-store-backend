import { PrismaService } from "@/database";
import { CreatePaymentTransactionDto } from "@/modules/payment/dto/request/create-payment.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PaymentRepository {
    constructor(private readonly prisma: PrismaService) {

    }

    createPaymentTransaction(userId: bigint, payment: CreatePaymentTransactionDto) {
        return this.prisma.paymentTransaction.create({
            data: {
                userId,
                ...payment
            }
        })
    }

    createPaymentTransactionGuestId(payment: CreatePaymentTransactionDto) {
        return this.prisma.paymentTransaction.create({
            data: {
                ...payment
            }
        })
    }
}