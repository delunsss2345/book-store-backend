import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type DbClient = Prisma.TransactionClient | PrismaService;

export type CreateAuditLogParams = {
    actorUserId: number;
    action: string;
    entityType: string;
    entityId: string;
    before?: Prisma.InputJsonValue | null;
    after?: Prisma.InputJsonValue | null;
    ip?: string | null;
};

@Injectable()
export class AuditLogRepository {
    constructor(private readonly prisma: PrismaService) { }

    createAuditLog(params: CreateAuditLogParams, tx?: Prisma.TransactionClient) {
        const db: DbClient = tx ?? this.prisma;

        return db.auditLog.create({
            data: {
                actorUserId: params.actorUserId,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                before:
                    params.before === undefined
                        ? undefined
                        : params.before === null
                            ? Prisma.JsonNull
                            : params.before,
                after:
                    params.after === undefined
                        ? undefined
                        : params.after === null
                            ? Prisma.JsonNull
                            : params.after,
                ip: params.ip ?? null,
            },
        });
    }
}
