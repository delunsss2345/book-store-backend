import { PresignRequestDto } from "@/modules/uploads/dto/request/get-single-url.dto";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, ValidateNested } from 'class-validator';

export class PresignMultipleRequestDto {
    @ApiProperty({
        type: [PresignRequestDto],
        description: 'List of files to generate presigned upload URLs',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PresignRequestDto)
    files: PresignRequestDto[];
}

