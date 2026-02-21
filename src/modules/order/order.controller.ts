import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { CreateGuestOrdersAndPaymentDTO } from '@/modules/order/dto/request/create-orders.dto';
import { OrderService } from '@/modules/order/order.service';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

@Controller('orders')
@UseGuards(ShopperSessionGuard)
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post('/guest')
    @Public()
    createOrders(@Body() body: CreateGuestOrdersAndPaymentDTO, @Req() req: Request) {
        const guestSessionId = req['guestSessionId'] as string;
        return this.orderService.createOrdersGuest(guestSessionId, body);
    }


    // @Post('/')
    // @Public()
    // createOrdersGuest(@Body() body: CreateUserOrdersAndPaymentDTO, @Req() req: Request) {
    //     const user = req['user'] as JwtPayload;
    //     return this.orderService.createOrdersUser(BigInt(user.sub), body)
    // }
}