import { CatalogBookCardDto } from '@/modules/catalog/dto/response';
import { ApiProperty } from '@nestjs/swagger';

export class SearchBookItemDto extends CatalogBookCardDto {
    @ApiProperty({ example: 0.9123 })
    score: number;
}
