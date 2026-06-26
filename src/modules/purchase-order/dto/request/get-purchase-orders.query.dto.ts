import { BasePaginationDto } from "@/common/pagination/request/base-pagination.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { PurchaseOrderStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional } from "class-validator";

export class GetPurchaseOrdersQueryDto extends BasePaginationDto {
    @ApiPropertyOptional({ enum: PurchaseOrderStatus })
    @IsOptional()
    @IsEnum(PurchaseOrderStatus)
    @Transform(({ value }) => value?.toUpperCase())
    status?: PurchaseOrderStatus;
}
