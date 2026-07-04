import { ApiProperty } from '@nestjs/swagger';

export class SupplierItemResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'Cty Van Chuyen Sach A' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
