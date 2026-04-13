import {
  AdminOrderDetailResponseDto,
  AdminOrderItemBaseResponseDto,
  AdminOrderUserSummaryResponseDto,
  AdminGuestOrderItemResponseDto,
  AdminUserOrderItemResponseDto,
} from '@/modules/admin/dto/response';
import { UserAddressResponseDto } from '@/modules/admin/dto/response/admin-user-address.response.dto';
import { Prisma } from '@prisma/client';
import {
  GuestOrderListRow,
  OrderDetailRow,
  UserOrderListRow,
} from './admin-order.select';

type SharedOrderListRow = GuestOrderListRow | UserOrderListRow;

export function toDecimalText(
  value: Prisma.Decimal | number | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value).toFixed(2);
}

function toOrderItemBase(
  row: SharedOrderListRow,
): AdminOrderItemBaseResponseDto {
  return {
    id: row.id.toString(),
    orderCode: row.orderCode,
    status: row.status ? String(row.status) : null,
    paymentStatus: row.paymentStatus ? String(row.paymentStatus) : null,
    subtotal: toDecimalText(row.subtotal),
    discountAmount: toDecimalText(row.discountAmount),
    shippingFee: toDecimalText(row.shippingFee),
    totalAmount: toDecimalText(row.totalAmount),
    currencyCode: row.currencyCode ?? null,
    placedAt: row.placedAt ?? null,
    createdAt: row.createdAt,
    expiredAt: row.expiredAt,
    updatedAt: row.updatedAt,
  };
}

function toOrderUserSummary(
  user: UserOrderListRow['user'],
): AdminOrderUserSummaryResponseDto | null {
  if (!user) {
    return null;
  }

  return {
    email: user.email ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
  };
}

function toAddressUser(
  addressUser: UserOrderListRow['addressUser'],
): UserAddressResponseDto | null {
  if (!addressUser) {
    return null;
  }

  return {
    id: addressUser.id,
    userId: addressUser.userId,
    recipientName: addressUser.recipientName,
    phoneNumber: addressUser.phoneNumber,
    addressDetail: addressUser.addressDetail,
    addressType: addressUser.addressType ?? '',
    city: addressUser.city,
    district: addressUser.district,
    ward: addressUser.ward,
    isDefault: addressUser.isDefault ?? false,
    createdAt: addressUser.createdAt.toISOString(),
    updatedAt: addressUser.updatedAt.toISOString(),
    deletedAt: addressUser.deletedAt?.toISOString() ?? null,
  };
}

export function toOrderItemGuest(
  row: GuestOrderListRow,
): AdminGuestOrderItemResponseDto {
  return {
    ...toOrderItemBase(row),
    guestSessionId: row.guestSessionId ?? null,
    guestEmail: row.guestEmail ?? null,
    address: row.address ?? null,
  };
}

export function toOrderItemUser(
  row: UserOrderListRow,
): AdminUserOrderItemResponseDto {
  return {
    ...toOrderItemBase(row),
    userId: row.userId ? row.userId.toString() : null,
    user: toOrderUserSummary(row.user),
    addressUser: toAddressUser(row.addressUser),
  };
}

export function toOrderDetailResponse(
  row: NonNullable<OrderDetailRow>,
): AdminOrderDetailResponseDto {
  return {
    items: row.items.map((item) => ({
      id: item.id.toString(),
      bookVariantSnapshotId: item.bookVariantSnapshotId.toString(),
      quantity: item.quantity,
      unitPrice: toDecimalText(item.unitPrice) as string,
      lineTotal: toDecimalText(item.lineTotal) as string,
      createdAt: item.createdAt,
      titleSnapshot: item.bookVariantSnapshot.titleSnapshot ?? null,
      coverImageUrlSnapshot:
        item.bookVariantSnapshot.coverImageUrlSnapshot ?? null,
      skuSnapshot: item.bookVariantSnapshot.skuSnapshot,
      priceSnapshot: toDecimalText(
        item.bookVariantSnapshot.priceSnapshot,
      ) as string,
      currencyCodeSnapshot:
        item.bookVariantSnapshot.currencyCodeSnapshot ?? null,
      formatSnapshot: String(item.bookVariantSnapshot.formatSnapshot),
      editionSnapshot: item.bookVariantSnapshot.editionSnapshot ?? null,
      isbnSnapshot: item.bookVariantSnapshot.isbnSnapshot ?? null,
    })),
  };
}
