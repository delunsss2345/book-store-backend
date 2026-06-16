import { IS_REFRESH_KEY } from '@/common/security/decorators/refresh.decorator';
import { UserSessionService } from '@/modules/auth/service/user-session.service';
import { hashToken } from '@/utils/hashToken.util';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionStatus } from '@prisma/client';
import { Request } from 'express';

@Injectable()
export class RefreshGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly userSessionService: UserSessionService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isRefresh = this.reflector.getAllAndOverride<boolean>(IS_REFRESH_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!isRefresh) return true;

        const request = context.switchToHttp().getRequest<Request>();

        const refreshToken = this.extractRefreshTokenFromBody(request);
        if (!refreshToken) throw new UnauthorizedException();

        const refreshTokenHash = hashToken(refreshToken);
        const session = await this.userSessionService.findByRefreshTokenHash(refreshTokenHash);
        if (!session) throw new UnauthorizedException();
        if (session.status !== SessionStatus.ACTIVE || session.revokedAt) {
            throw new UnauthorizedException();
        }

        if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
            await this.userSessionService.markSessionExpired(session.id);
            throw new UnauthorizedException();
        }

        request['refreshSession'] = session;

        return true;
    }

    private extractRefreshTokenFromBody(request: Request): string | undefined {
        const body = request.body as { refreshToken?: string };
        return body?.refreshToken;
    }

}
