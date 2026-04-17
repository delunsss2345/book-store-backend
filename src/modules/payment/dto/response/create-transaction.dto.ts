import { CreateUrlPaymentResponseDTO } from "@/modules/payment/dto/response/create-url-payment.dto"

export class CreateTransactionDto {
    result: CreateUrlPaymentResponseDTO
    orderId: string
    message: string
}