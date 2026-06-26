import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateAdminStockImportItemRequestDto {
  @ApiProperty({ example: 'cm7xitem123', description: 'ID của purchase order item' })
  @IsString()
  purchaseOrderItemId: string;

  @ApiProperty({ example: 10, description: 'Số lượng thực nhận' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  realQuantity: number;
}

export class CreateAdminStockImportRequestDto {
  @ApiProperty({ example: 'cm7xpo123', description: 'ID của purchase order' })
  @IsString()
  purchaseOrderId: string;

  @ApiPropertyOptional({ example: 'Nhập kho đợt 1', description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [CreateAdminStockImportItemRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAdminStockImportItemRequestDto)
  items: CreateAdminStockImportItemRequestDto[];
}
