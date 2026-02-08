import { ApiProperty } from "@nestjs/swagger";

export class BaseResponseUuidDto {
    @ApiProperty()
    id: string

    @ApiProperty()
    createdAt: Date

    @ApiProperty()
    updatedAt: Date
}