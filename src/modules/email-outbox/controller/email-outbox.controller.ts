import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetEmailOutboxQueryDto } from '../dto/request';
import { EmailOutboxResponseDto } from '../dto/response';
import { EmailOutboxService } from '../service/email-outbox.service';

@ApiTags('Email Outbox')
@Controller('email-outbox')
export class EmailOutboxController {
  constructor(private readonly emailOutboxService: EmailOutboxService) {}

  @Get()
  @RequirePermissions(PermissionCode.EMAIL_OUTBOX_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get email outbox list' })
  @ApiOkResponse({ type: EmailOutboxResponseDto, isArray: true })
  getOtpOutbox(@Query() query: GetEmailOutboxQueryDto) {
    return this.emailOutboxService.getOtpEmailOutbox(query);
  }
}
