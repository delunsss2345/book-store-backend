import { ApiProperty } from '@nestjs/swagger';

export class LoginAttemptResponseDto {
    @ApiProperty({ type: String })
    id: string;

    @ApiProperty({ type: String, required: false, nullable: true })
    userId?: string;

    @ApiProperty({ required: false, nullable: true })
    ip?: string;

    @ApiProperty({ required: false, nullable: true })
    userAgent?: string;

    @ApiProperty({ required: false, nullable: true })
    success?: boolean;

    @ApiProperty({ required: false, nullable: true })
    failureReason?: string;

    @ApiProperty()
    createdAt: Date;
}
