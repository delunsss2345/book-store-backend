import { Module } from '@nestjs/common';
import { AuditLogRepository } from './audit-log.repository';
import { AuditLogService } from './audit-log.service';

@Module({
    providers: [AuditLogService, AuditLogRepository],
    exports: [AuditLogService, AuditLogRepository],
})
export class AuditLogModule { }
