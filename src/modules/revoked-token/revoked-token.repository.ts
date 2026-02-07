import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { RevokedToken } from '@prisma/client';

@Injectable()
export class RevokedTokenRepository {
    constructor(private readonly prisma: PrismaService) { }

    upsertRevokedToken(tokenHash: string, expiresAt: Date): Promise<RevokedToken> {
        return this.prisma.revokedToken.upsert({
            where: { tokenHash },
            update: {
                revokedAt: new Date(),
                expiresAt,
            },
            create: {
                tokenHash,
                expiresAt,
            },
        });
    }

    existsByHash(tokenHash: string): Promise<boolean> {
        return this.prisma.revokedToken
            .findUnique({ where: { tokenHash }, select: { id: true } })
            .then(Boolean);
    }
}
