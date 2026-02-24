import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditLogRepository, CreateAuditLogParams } from './audit-log.repository';

@Injectable()
export class AuditLogService {
    constructor(private readonly auditLogRepository: AuditLogRepository) { }

    createAuditLog(params: CreateAuditLogParams, tx?: Prisma.TransactionClient) {
        return this.auditLogRepository.createAuditLog(params, tx);
    }
}
