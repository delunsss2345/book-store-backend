import { ApiProperty } from '@nestjs/swagger';
import { SessionStatus } from '@prisma/client';

export class UserSessionResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty({ type: String })
    userId: string;

    @ApiProperty({ type: String, required: false, nullable: true })
    deviceId?: string | null;

    @ApiProperty({ enum: SessionStatus })
    status: SessionStatus;

    @ApiProperty()
    refreshTokenHash: string;

    @ApiProperty({ required: false, nullable: true })
    userAgent?: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty({ required: false, nullable: true })
    expiresAt?: Date | null;

    @ApiProperty({ required: false, nullable: true })
    revokedAt?: Date | null;
}
