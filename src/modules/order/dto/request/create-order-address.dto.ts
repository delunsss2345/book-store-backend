import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";


export class CreateOrderAddressDTO {
    @ApiProperty({ example: "VN", description: "Country code" })
    @IsString()
    @IsNotEmpty()
    country: string;

    @ApiPropertyOptional({ example: "Nguyễn Văn A", description: "Tên người nhận (dùng trực tiếp nếu có)" })
    @IsString()
    @IsOptional()
    recipientName?: string;

    @ApiProperty({ example: "Nguyễn", description: "Họ và tên đệm" })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: "A", description: "Tên" })
    @IsString()
    @IsNotEmpty()
    lastName: string;


    @ApiPropertyOptional({ example: "Số 123 Đường ABC, Phường 4, Quận Tân Bình" })
    @IsString()
    @IsOptional()
    addressLine: string;

    @ApiProperty({ example: "TP. Hồ Chí Minh" })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiPropertyOptional({ example: "Phường 4" })
    @IsString()
    @IsOptional()
    ward?: string;

    @ApiPropertyOptional({ example: "Quận Tân Bình" })
    @IsString()
    @IsOptional()
    district?: string;

    @ApiPropertyOptional({ example: "700000", description: "Postal code (optional)" })
    @IsString()
    @IsOptional()
    postalCode?: string;


    @ApiPropertyOptional({ example: "0901234567" })
    @IsString()
    @IsOptional()
    phoneNumber: string;

    @ApiPropertyOptional({ example: "VN", description: "Mã quốc gia ISO-2" })
    @IsString()
    @IsOptional()
    countryCode?: string;

    @ApiPropertyOptional({ example: "Giao giờ hành chính" })
    @IsString()
    @IsOptional()
    note?: string;
}
