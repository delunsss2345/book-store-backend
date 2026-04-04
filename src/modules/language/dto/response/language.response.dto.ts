import { ApiProperty } from '@nestjs/swagger';

export class LanguageResponseDto {
    @ApiProperty({ example: '1' })
    id: string;

    @ApiProperty({ example: 'vi' })
    code: string;

    @ApiProperty({ example: 'Vietnamese' })
    name: string;
}
