import { ApiProperty } from '@nestjs/swagger';
import { EmailStatus, Prisma } from '@prisma/client';

export class EmailOutboxResponseDto {
    @ApiProperty({ type: String })
    id: string;

    @ApiProperty()
    toEmail: string;

    @ApiProperty({ required: false, nullable: true })
    toName?: string;

    @ApiProperty({ required: false, nullable: true })
    subject?: string;

    @ApiProperty({ required: false, nullable: true })
    templateKey?: string;

    @ApiProperty({ type: Object })
    payload: Prisma.JsonValue;

    @ApiProperty({ enum: EmailStatus, required: false, nullable: true })
    status?: EmailStatus;

    @ApiProperty({ required: false, nullable: true })
    scheduledAt?: Date;

    @ApiProperty({ required: false, nullable: true })
    sentAt?: Date;

    @ApiProperty({ required: false, nullable: true })
    attempts?: number;

    @ApiProperty({ required: false, nullable: true })
    lastError?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}
