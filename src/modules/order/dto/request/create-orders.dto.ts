import { CreateOrderAddressDTO } from "@/modules/order/dto/request/create-order-address.dto";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { PaymentGateway } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";



export class CreateGuestOrdersAndPaymentDTO {
    @ApiProperty({ example: 123 })
    @IsNumber()
    @IsNotEmpty()
    cartId: number;

    @ApiPropertyOptional({
        example: "guest@example.com",
        description: "Bắt buộc nếu checkout dạng guest",
    })
    @IsEmail()
    @IsString()
    @IsOptional()
    guestEmail?: string;

    @ApiPropertyOptional({ example: true, description: "Nhận newsletter (guest)" })
    @IsBoolean()
    @IsOptional()
    newsletter?: boolean;

    @ApiProperty({ enum: PaymentGateway, example: PaymentGateway.VNPAY })
    @IsEnum(PaymentGateway)
    @IsNotEmpty()
    paymentGateway: PaymentGateway;


    @ApiPropertyOptional({ example: "Giao giờ hành chính" })
    @IsString()
    @IsOptional()
    note?: string;

    @ApiProperty({ example: 'vi' })
    @IsString()
    @IsNotEmpty()
    languageCode: string;


    @ApiProperty({ type: CreateOrderAddressDTO })
    @ValidateNested()
    @Type(() => CreateOrderAddressDTO)
    orderAddress: CreateOrderAddressDTO;
}


export class CreateUserOrdersAndPaymentDTO {
    @ApiProperty({ example: 123 })
    @IsNumber()
    @Type(() => Number)
    @IsNotEmpty()
    cartId: number;

    @ApiPropertyOptional({ example: 1 })
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    addressId?: number

    @ApiProperty({ enum: PaymentGateway, example: PaymentGateway.VNPAY })
    @IsEnum(PaymentGateway)
    @IsNotEmpty()
    @Type(() => String)
    paymentGateway: PaymentGateway;


    @ApiPropertyOptional({ example: "Giao giờ hành chính" })
    @IsString()
    @IsOptional()
    note?: string;
}

export class CreateGuestOrderDTO {
    @ApiProperty({ example: 123, description: 'ID của giỏ hàng' })
    @IsNumber()
    @IsNotEmpty()
    cartId: number;

    @ApiPropertyOptional({ example: 'abc-123-def', description: 'Session ID của khách vô danh' })
    @IsUUID()
    @IsOptional()
    guestSessionId?: string;

    @ApiPropertyOptional({ example: 'guest@example.com' })
    @IsEmail()
    @IsOptional()
    guestEmail?: string;

    @ApiProperty({ example: 'VND' })
    @IsString()
    @IsNotEmpty()
    currencyCode: string;

    // Các trường địa chỉ (Cần thiết cho Order)
    @ApiProperty({ example: 'Nguyễn Văn A' })
    @IsString()
    @IsNotEmpty()
    receiverName: string;

    @ApiProperty({ example: '0901234567' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ example: '123 Đường ABC, Quận 1, TP.HCM' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiPropertyOptional({ description: 'Key để tránh gửi trùng đơn hàng' })
    @IsString()
    @IsOptional()
    idempotencyKey?: string;
}
