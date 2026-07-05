import { ApiProperty } from "@nestjs/swagger";

export class ResponsePaginationDto<T> {
    @ApiProperty({ example: 1, description: 'Current page number' })
    page: number;
    @ApiProperty({ example: 20, description: 'Number of items per page' })
    limit: number;
    @ApiProperty({ example: 100, description: 'Total number of items' })
    total: number;
    @ApiProperty({ example: 5, description: 'Total number of pages' })
    totalPages: number;
    @ApiProperty({ description: 'List of items for the current page' })
    items: T[];
}