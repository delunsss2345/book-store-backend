import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GuestSessionService } from '../service/guest-session.service';

@ApiTags('guest-sessions')
@Controller('guest-sessions')
export class GuestSessionController {
  constructor(private readonly guestSessionService: GuestSessionService) {}

  @Get()
  @RequirePermissions(PermissionCode.GUEST_SESSION_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all guest sessions' })
  @ApiOkResponse({ type: Object, isArray: true })
  getAllGuestSessions() {
    return this.guestSessionService.getAllGuestSessions();
  }

  @Get(':guestSessionId')
  @RequirePermissions(PermissionCode.GUEST_SESSION_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a guest session by ID' })
  @ApiParam({
    name: 'guestSessionId',
    type: String,
    description: 'The unique identifier of the guest session',
  })
  @ApiOkResponse({ type: Object })
  getGuestSessionById(@Param('guestSessionId') guestSessionId: string) {
    return this.guestSessionService.getGuestSessionById(guestSessionId);
  }
}
