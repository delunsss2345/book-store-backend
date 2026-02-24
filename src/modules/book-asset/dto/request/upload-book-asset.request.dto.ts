import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UploadBookAssetRequestDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;

  @ApiProperty({ required: false, example: 'cover' })
  type?: string;

  @ApiProperty({ required: true, example: '1' })
  @IsNotEmpty()
  bookVariantId: string;
}
