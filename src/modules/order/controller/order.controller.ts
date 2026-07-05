import { JwtPayload } from '@/common';
import { GetGuestSessionId } from '@/common/decorators/getGuestSessionId.decorator';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import { CreateCheckOutDTO } from '@/modules/order/dto/request/create-orders.dto';
import { GetOrderDto } from '@/modules/order/dto/request/get-order.dto';
import { OrderCheckoutResponse } from '@/modules/order/dto/response/order-checkout.response';
import { OrderService } from '@/modules/order/service/order.service';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
@ApiTags('Orders')
@Controller('orders')
@UseGuards(ShopperSessionGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('/checkout')
  @Public()
  @ApiOperation({ summary: 'Create a checkout and initiate payment' })
  @ApiBody({ type: CreateCheckOutDTO })
  @ApiCreatedResponse({ description: 'Checkout created successfully', type: OrderCheckoutResponse })
  createCheckout(
    @Body() body: CreateCheckOutDTO,
    @GetGuestSessionId() guestSessionId: string | null,
    @GetUser() user: JwtPayload | null,
  ) {
    const userId = user?.sub ? Number(user.sub) : null;
    return this.orderService.createCheckout(body, guestSessionId, userId);
  }


  @Get('/')
  @Public()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get list of orders for the current user or guest session' })
  @ApiOkResponse({ description: 'Orders retrieved successfully', type: Object })
  getOrders(
    @Query() query: GetOrderDto,
    @GetUser() user: JwtPayload | null,
    @GetGuestSessionId() guestSessionId: string
  ) {
    if (guestSessionId) {
      return this.orderService.getOrderGuest(
        guestSessionId,
        query.page ?? 1,
        query.limit ?? 12,
      );
    }
    if (!user?.sub) throw new UnauthorizedException();
    return this.orderService.getOrderUser(
      Number(user?.sub),
      query.page ?? 1,
      query.limit ?? 12,
    );
  }

  @Get('/:orderId')
  @Public()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get order detail by order ID' })
  @ApiParam({ name: 'orderId', type: String, description: 'The ID of the order' })
  @ApiOkResponse({ description: 'Order detail retrieved successfully', type: Object })
  getOrder(
    @Req() req: Request,
    @GetUser() user: JwtPayload | null,
    @Param('orderId') orderId: string,
    @GetLanguageId() langId: number,
  ) {
    const guestSessionId = req['guestSessionId'] as string;
    if (guestSessionId) {
      return this.orderService.getOrderDetailGuest(Number(orderId), guestSessionId, langId);
    }
    if (!user?.sub) throw new UnauthorizedException();
    return this.orderService.getOrderDetailUser(
      Number(orderId),
      Number(user.sub),
      langId,
    );
  }




}
