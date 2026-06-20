import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { GetLoginAttemptByUserQueryDto } from '../dto/request';
import { LoginAttemptService } from '../service/login-attempt.service';

@Controller('login-attempt')
export class LoginAttemptController {
    constructor(private readonly loginAttemptService: LoginAttemptService) { }

    @Get('user/:userId')
    @RequirePermissions(PermissionCode.LOGIN_ATTEMPT_READ_BY_USER)
    getByUserId(
        @Param('userId') userId: string,
        @Query() query: GetLoginAttemptByUserQueryDto,
    ) {
        const parsedUserId = Number(userId);
        return this.loginAttemptService.getByUserId(parsedUserId, query.limit);
    }
}
