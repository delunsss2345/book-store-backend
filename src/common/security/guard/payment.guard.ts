import { AppModule } from '@/app.module';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PAYMENT_KEY } from '../decorators/payment.decorator';

@Injectable()
export class PaymentGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const isPayment = this.reflector.getAllAndOverride<boolean>(IS_PAYMENT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!isPayment) return true;

        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) throw new UnauthorizedException();
        const API_KEY = AppModule.CONFIGURATION.SEPAY_CONFIG.MERCHANT_SECRET_KEY;
        if (!API_KEY || API_KEY !== token) throw new UnauthorizedException();

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const authorization = request.headers.authorization;
        if (!authorization) return undefined;

        const [scheme, ...tokenParts] = authorization.trim().split(' ');
        if (!scheme || !tokenParts.length) return undefined;
        if (scheme.toLowerCase() !== 'apikey') return undefined;

        const token = tokenParts.join(' ').trim();
        return token || undefined;
    }
}
