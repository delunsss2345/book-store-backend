import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PresignRequestDto {
    @ApiProperty({
        example: 'nike.jpg',
        description: 'Original file name from client',
    })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiProperty({
        example: 'image/jpeg',
        description: 'MIME type of the file',
    })
    @IsString()
    @IsNotEmpty()
    fileType: string;
}