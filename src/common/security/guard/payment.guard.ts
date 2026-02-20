
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PAYMENT_KEY } from '../decorators/payment.decorator';
import { AppModule } from '@/app.module';

@Injectable()
export class PaymentGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector
    ) { }


    canActivate(context: ExecutionContext): boolean {
        const isPayment = this.reflector.getAllAndOverride<boolean>(IS_PAYMENT_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!isPayment) return false;

        const request = context.switchToHttp().getRequest<Request>();

        const token = this.extractTokenFromHeader(request);
        if (!token) throw new UnauthorizedException();
        const API_KEY = AppModule.CONFIGURATION.SEPAY_CONFIG.MERCHANT_SECRET
        try {
            if(API_KEY !== token) throw new UnauthorizedException();
        } catch {
            throw new UnauthorizedException();
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Apikey' ? token : undefined;
    }
}
