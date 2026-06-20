import { Module } from '@nestjs/common';
import { AuditLogRepository } from './repository/audit-log.repository';
import { AuditLogService } from './service/audit-log.service';

@Module({
    providers: [AuditLogService, AuditLogRepository],
    exports: [AuditLogService, AuditLogRepository],
})
export class AuditLogModule { }
