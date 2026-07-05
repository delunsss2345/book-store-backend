import { ApiProperty } from '@nestjs/swagger';

export class UserAddressResponseDto {
    @ApiProperty({ example: '2', description: 'ID của địa chỉ' })
    id: number;

    @ApiProperty({ example: '25', description: 'ID của người dùng sở hữu địa chỉ' })
    userId: number;

    @ApiProperty({ example: 'Phạm Thanh Huy Phạm Thanh', description: 'Tên người nhận' })
    recipientName: string;

    @ApiProperty({ example: '0814893279', description: 'Số điện thoại liên lạc' })
    phoneNumber: string;

    @ApiProperty({ example: '350/9 Nguyễn Văn Lượng Gò Vấp', description: 'Địa chỉ cụ thể' })
    addressDetail: string;

    @ApiProperty({
        description: 'Loại địa chỉ (Nhà riêng/Văn phòng)'
    })
    addressType: string;

    @ApiProperty({ example: 'Hồ Chí Minh' })
    city: string;

    @ApiProperty({ example: 'Quận 2' })
    district: string;

    @ApiProperty({ example: 'Sài thành' })
    ward: string;

    @ApiProperty({ example: true, description: 'Có phải địa chỉ mặc định không?' })
    isDefault: boolean;

    @ApiProperty({ example: '2026-03-28T12:51:26.106Z' })
    createdAt: string;

    @ApiProperty({ example: '2026-03-28T12:51:26.106Z' })
    updatedAt: string;

    @ApiProperty({ example: null, nullable: true })
    deletedAt: string | null;
}