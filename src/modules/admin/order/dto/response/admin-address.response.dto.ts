import { ApiProperty } from '@nestjs/swagger';

export class OrderAddressDto {
    @ApiProperty({ example: '13', description: 'ID của bản ghi' })
    id: number;

    @ApiProperty({ example: '37', description: 'ID đơn hàng' })
    orderId: number;

    @ApiProperty({ example: 'Phạm Thanh Huy Phạm Thanh', description: 'Tên người nhận' })
    recipientName: string;

    @ApiProperty({ example: '0814893279', description: 'Số điện thoại' })
    phoneNumber: string;

    @ApiProperty({ example: '350/9 Nguyễn Văn Lượng Gò Vấp', description: 'Địa chỉ chi tiết' })
    addressLine: string;

    @ApiProperty({ example: 'Ho Chi Minh', description: 'Thành phố' })
    city: string;

    @ApiProperty({ example: null, nullable: true, description: 'Mã quốc gia' })
    countryCode: string | null;

    @ApiProperty({ example: null, nullable: true, description: 'Quận/Huyện' })
    district: string | null;

    @ApiProperty({ example: null, nullable: true, description: 'Phường/Xã' })
    ward: string | null;

    @ApiProperty({ example: '', description: 'Ghi chú' })
    note: string | null;
}