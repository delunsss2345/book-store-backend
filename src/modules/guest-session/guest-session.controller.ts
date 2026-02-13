import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Param } from '@nestjs/common';
import { GuestSessionService } from './guest-session.service';

@Controller('guest-sessions')
export class GuestSessionController {
    constructor(private readonly guestSessionService: GuestSessionService) { }

    @Get()
    @RequirePermissions(PermissionCode.GUEST_SESSION_GET_ALL)
    getAllGuestSessions() {
        return this.guestSessionService.getAllGuestSessions();
    }

    @Get(':guestSessionId')
    @RequirePermissions(PermissionCode.GUEST_SESSION_GET_ALL)
    getGuestSessionById(@Param('guestSessionId') guestSessionId: string) {
        return this.guestSessionService.getGuestSessionById(guestSessionId);
    }
}
