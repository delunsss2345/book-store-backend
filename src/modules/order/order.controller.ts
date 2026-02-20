import { JwtPayload } from '@/common';
import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { CreateOrdersAndPaymentDTO } from '@/modules/order/dto/request/create-orders.dto';
import { OrderService } from '@/modules/order/order.service';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

@Controller('orders')
@UseGuards(ShopperSessionGuard)
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post('/')
    @Public()
    createOrders(@Body() body: CreateOrdersAndPaymentDTO, @Req() req: Request) {
        const guestSessionId = req['guestSessionId'] as string;
        const user = req['user'] as JwtPayload;

        if (guestSessionId) {
            return this.orderService.createOrdersGuest(guestSessionId, body);
        }
        return this.orderService.createOrdersUser(BigInt(user.sub), body)
    }
}