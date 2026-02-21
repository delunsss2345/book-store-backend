import { AuthRepository } from '@/modules/auth/auth.repository';
import { GuestSessionService } from '@/modules/guest-session/guest-session.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import { Request, Response } from 'express';

@Injectable()
export class ShopperSessionGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly guestSessionService: GuestSessionService,
        private readonly authRepository: AuthRepository
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const token = this.extractTokenFromHeader(request);

        // Guard dùng chung cho cart/wishlist: không có token thì chuyển sang guest session.
        if (!token) {
            await this.attachGuestSession(request, response, true);
            return true;
        }

        try {

            const payload = await this.jwtService.verifyAsync<{ sub?: string }>(token);
            const userId = this.parseUserId(payload?.sub);
            if (!userId) {
                await this.attachGuestSession(request, response, true);
                return true;
            }

            const user = await this.authRepository.findUserById(userId);

            if (!user) {
                await this.attachGuestSession(request, response, true);
                return true;
            }

            request['user'] = user
            request['authError'] = false;
            return true;
        } catch {
            await this.attachGuestSession(request, response, true);
            return true;
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    private parseUserId(value: string | undefined): bigint | null {
        if (!value) return null;

        try {
            return BigInt(value);
        } catch {
            return null;
        }
    }

    private resolveIp(request: Request): string | null {
        const forwardedFor = request.headers['x-forwarded-for'];
        if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
            return forwardedFor.split(',')[0].trim();
        }

        if (Array.isArray(forwardedFor) && forwardedFor[0]) {
            return forwardedFor[0].split(',')[0].trim();
        }

        return request.ip ?? request.socket?.remoteAddress ?? null;
    }

    private hashUserAgent(request: Request): string | null {
        const userAgent = request.headers['user-agent'];
        const rawUserAgent = Array.isArray(userAgent) ? userAgent[0] : userAgent;
        if (!rawUserAgent) return null;
        return createHash('sha256').update(rawUserAgent).digest('hex');
    }

    private async attachGuestSession(request: Request, response: Response, authError: boolean): Promise<void> {
        const sessionId = request.cookies?.guestSessionId;
        if (sessionId) {
            const guestSession = await this.guestSessionService.updateLastSeenGuestSessionById(sessionId);
            if (guestSession) {
                request['guestSession'] = guestSession;
                request['guestSessionId'] = guestSession.id;
                request['authError'] = authError;
                this.setGuestSessionCookie(response, guestSession.id);
                return;
            }
        }
        // Truyền thêm sessionId vì có thể trong trường hợp cookie có sessionId nhưng mình lại không tìm thấy guest đó trong db 
        // Nên phải tạo để tránh bị bug tìm không thấy guestSessionId tạo mới liên tục (Trường hợp tình cờ xảy ra khi đã xoá database tạo lại).
        const guestSession = await this.guestSessionService.createGuestSession(
            sessionId,
            this.resolveIp(request),
            this.hashUserAgent(request),
        );

        request['guestSession'] = guestSession;
        request['guestSessionId'] = guestSession.id;
        this.setGuestSessionCookie(response, guestSession.id);
        request['authError'] = authError;
    }

    private setGuestSessionCookie(response: Response, guestSessionId: string) {
        response.cookie('guestSessionId', guestSessionId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 5,
            path: '/',
        });
    }
}
