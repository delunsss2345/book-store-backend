import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { GetEmailOutboxQueryDto } from '../dto/request';
import { EmailOutboxService } from '../service/email-outbox.service';

@Controller('email-outbox')
export class EmailOutboxController {
    constructor(private readonly emailOutboxService: EmailOutboxService) { }

    @Get()
    @RequirePermissions(PermissionCode.EMAIL_OUTBOX_GET)
    getOtpOutbox(@Query() query: GetEmailOutboxQueryDto) {
        return this.emailOutboxService.getOtpEmailOutbox(query);
    }
}
