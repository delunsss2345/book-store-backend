import { SecurityMessage } from '@/common';
import { IS_PUBLIC_KEY } from '@/common/security/decorators/public.decorator';
import { IS_REFRESH_KEY } from '@/common/security/decorators/refresh.decorator';
import { RevokedTokenService } from '@/modules/revoked-token/revoked-token.service';
import { tokenHash } from '@/utils/hashToken.util';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly revokedTokenService: RevokedTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const isRefresh = this.reflector.getAllAndOverride<boolean>(
      IS_REFRESH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || isRefresh) return true;

    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const hashedToken = tokenHash(token);

      // check xem accessToken đã bị revoked ch
      const isRevoked = await this.revokedTokenService.isRevoked(hashedToken);
      if (isRevoked) {
        throw new UnauthorizedException(SecurityMessage.SESSION_REVOKED);
      }

      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
