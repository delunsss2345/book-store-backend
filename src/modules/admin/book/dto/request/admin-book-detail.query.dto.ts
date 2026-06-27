import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum AdminBookDetailType {
  VIEW_PRICE = 'view_price',
}

export class AdminBookDetailQueryDto {
  @IsOptional()
  @IsEnum(AdminBookDetailType)
  @ApiPropertyOptional({ enum: AdminBookDetailType })
  type?: AdminBookDetailType;
}
