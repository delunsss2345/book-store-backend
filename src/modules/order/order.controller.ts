import { GetLanguage } from '@/common/decorators/getLanguage.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { CreateGuestOrdersAndPaymentDTO, CreateUserOrdersAndPaymentDTO } from '@/modules/order/dto/request/create-orders.dto';
import { OrderService } from '@/modules/order/order.service';
import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
@Controller('orders')
@UseGuards(ShopperSessionGuard)
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post('/guest/checkout')
    @Public()
    createOrders(
        @Body() body: CreateGuestOrdersAndPaymentDTO,
        @Req() req: Request,
        @GetLanguage() lang: string,
    ) {
        const guestSessionId = req['guestSessionId'] as string;
        return this.orderService.createOrdersGuest(guestSessionId, body, lang);
    }

    @Post('/user/checkout')
    createOrdersUser(
        @Body() body: CreateUserOrdersAndPaymentDTO,
        @Req() req: Request,
        @GetLanguage() lang: string,
    ) {
        const user = req['user'] as { id?: bigint | number | string } | undefined;
        if (!user?.id) {
            throw new ForbiddenException('User not authenticated');
        }
        const userId = BigInt(user.id);
        return this.orderService.createOrdersUser(userId, body, lang);
    }
}
