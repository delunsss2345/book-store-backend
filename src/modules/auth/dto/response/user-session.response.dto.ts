import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform, SessionStatus } from '@prisma/client';

export class UserSessionDeviceResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  deviceFingerprint: string;

  @ApiProperty({ required: false, nullable: true })
  deviceName?: string | null;

  @ApiProperty({ enum: DevicePlatform, required: false, nullable: true })
  platform?: DevicePlatform | null;

  @ApiProperty({ required: false, nullable: true })
  osVersion?: string | null;

  @ApiProperty({ required: false, nullable: true })
  appVersion?: string | null;

  @ApiProperty()
  isTrusted: boolean;

  @ApiProperty({ required: false, nullable: true })
  firstSeenAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  lastSeenAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  revokedAt?: Date | null;
}

export class UserSessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: number;

  @ApiProperty({ required: false, nullable: true })
  deviceId?: number | null;

  @ApiProperty({ required: false, nullable: true })
  ip?: string | null;

  @ApiProperty({ enum: SessionStatus })
  status: SessionStatus;

  @ApiProperty({ required: false, nullable: true })
  userAgent?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false, nullable: true })
  expiresAt?: Date | null;

  @ApiProperty({ required: false, nullable: true })
  revokedAt?: Date | null;

  @ApiProperty({
    type: () => UserSessionDeviceResponseDto,
    required: false,
    nullable: true,
  })
  device?: UserSessionDeviceResponseDto | null;
}
