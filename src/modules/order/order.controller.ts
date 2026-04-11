import { OrderMessage } from '@/common';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { Public } from '@/common/security/decorators/public.decorator';
import { ShopperSessionGuard } from '@/common/security/guard/shopper-session.guard';
import {
  CreateGuestOrdersAndPaymentDTO,
  CreateUserOrdersAndPaymentDTO,
} from '@/modules/order/dto/request/create-orders.dto';
import { GetOrderDto } from '@/modules/order/dto/request/get-order.dto';
import { OrderService } from '@/modules/order/order.service';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { User } from '@prisma/client';
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
    @GetLanguageId() langId: number,
  ) {
    const guestSessionId = req['guestSessionId'] as string;
    return this.orderService.createOrdersGuest(guestSessionId, body, langId);
  }

  @Get('/')
  @Public()
  @ApiBearerAuth('access-token')
  getOrders(
    @Req() req: Request,
    @Query() query: GetOrderDto,
    @GetUser() user: User,
  ) {
    const guestSessionId = req['guestSessionId'] as string;
    if (guestSessionId) {
      return this.orderService.getOrderGuest(
        guestSessionId,
        query.page ?? 1,
        query.limit ?? 12,
      );
    }

    return this.orderService.getOrderUser(
      BigInt(user.id),
      query.page ?? 1,
      query.limit ?? 12,
    );
  }

  @Get('/:orderId')
  @Public()
  @ApiBearerAuth('access-token')
  getOrder(
    @Req() req: Request,
    @GetUser() user: User,
    @Param('orderId') orderId: string,
    @GetLanguageId() langId: number,
  ) {
    const guestSessionId = req['guestSessionId'] as string;
    if (guestSessionId) {
      return this.orderService.getOrderDetailGuest(BigInt(orderId), guestSessionId, langId);
    }

    return this.orderService.getOrderDetailUser(
      BigInt(orderId),
      BigInt(user.id),
      langId,
    );
  }

  @Post('/user/checkout')
  createOrdersUser(
    @Body() body: CreateUserOrdersAndPaymentDTO,
    @GetLanguageId() langId: number,
    @GetUser() user: User,
  ) {
    if (!user?.id) {
      throw new ForbiddenException(OrderMessage.USER_NOT_AUTHENTICATED);
    }
    const userId = BigInt(user.id);
    return this.orderService.createOrdersUser(userId, body, langId);
  }
}
