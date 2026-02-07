import { ApiProperty } from '@nestjs/swagger';

export class CreateLoginAttemptRequestDto {
    @ApiProperty({ type: String, required: false, nullable: true })
    userId?: bigint | null;

    @ApiProperty({ required: false, nullable: true })
    ip?: string | null;

    @ApiProperty({ required: false, nullable: true })
    userAgent?: string | null;

    @ApiProperty({ required: false, nullable: true })
    success?: boolean | null;

    @ApiProperty({ required: false, nullable: true })
    failureReason?: string | null;
}
