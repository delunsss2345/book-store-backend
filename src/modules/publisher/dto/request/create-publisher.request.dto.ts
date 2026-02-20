import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePublisherRequestDto {
    @ApiProperty({ example: 'Nha Xuat Ban Tre', maxLength: 255 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    defaultName: string;
}
