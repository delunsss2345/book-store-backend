import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum OtpTypeFilter {
    REGISTER = 'REGISTER',
    FORGOT_PASSWORD = 'FORGOT_PASSWORD',
}

export enum EmailOutboxStatusFilter {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
}

export class GetEmailOutboxQueryDto {
    @ApiPropertyOptional({ enum: OtpTypeFilter, description: 'OTP type filter' })
    @IsOptional()
    @IsEnum(OtpTypeFilter)
    otpType?: OtpTypeFilter;

    @ApiPropertyOptional({ enum: EmailOutboxStatusFilter, description: 'Email status filter' })
    @IsOptional()
    @IsEnum(EmailOutboxStatusFilter)
    status?: EmailOutboxStatusFilter;

    @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 200, default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number;
}
