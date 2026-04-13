import { AdminOrderMessage } from '@/common';
import { buildPaginatedResult } from '@/common/pagination/base-pagination.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminOrderListQueryDto } from '../dto/request';
import { AdminOrderRepository } from './admin-order.repository';
import {
  AdminOrderDetailResponseDto,
  AdminGuestOrderListResponseDto,
  AdminUserOrderListResponseDto,
} from '../dto/response';
import {
  toOrderDetailResponse,
  toOrderItemGuest,
  toOrderItemUser,
} from './mapper';

@Injectable()
export class AdminOrderService {
  constructor(private readonly adminOrderRepository: AdminOrderRepository) {}

  async getGuestOrders(
    query: AdminOrderListQueryDto,
  ): Promise<AdminGuestOrderListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.adminOrderRepository.countGuestOrders(),
      this.adminOrderRepository.findGuestOrders(page, limit),
    ]);

    return buildPaginatedResult(
      rows.map((row) => toOrderItemGuest(row)),
      total,
      page,
      limit,
    );
  }

  async getUserOrders(
    query: AdminOrderListQueryDto,
  ): Promise<AdminUserOrderListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [total, rows] = await Promise.all([
      this.adminOrderRepository.countUserOrders(),
      this.adminOrderRepository.findUserOrders(page, limit),
    ]);

    return buildPaginatedResult(
      rows.map((row) => toOrderItemUser(row)),
      total,
      page,
      limit,
    );
  }

  async getOrderDetail(orderId: bigint): Promise<AdminOrderDetailResponseDto> {
    const row = await this.adminOrderRepository.findOrderDetailById(orderId);
    if (!row) {
      throw new NotFoundException(AdminOrderMessage.ORDER_NOT_FOUND);
    }

    return toOrderDetailResponse(row);
  }
}
