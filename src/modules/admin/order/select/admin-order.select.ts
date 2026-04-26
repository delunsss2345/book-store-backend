import { Prisma } from '@prisma/client';

const adminOrderUserSelect = {
  select: {
    email: true,
    firstName: true,
    lastName: true,
  },
} as const;

const adminOrderListBaseSelect = {
  id: true,
  orderCode: true,
  userId: true,
  guestSessionId: true,
  user: adminOrderUserSelect,
  guestEmail: true,
  status: true,
  paymentStatus: true,
  subtotal: true,
  discountAmount: true,
  shippingFee: true,
  totalAmount: true,
  currencyCode: true,
  placedAt: true,
  createdAt: true,
  expiredAt: true,
  updatedAt: true,
} as const;

const bookVariantSnapshotSelect = {
  select: {
    titleSnapshot: true,
    coverImageUrlSnapshot: true,
    skuSnapshot: true,
    priceSnapshot: true,
    currencyCodeSnapshot: true,
    formatSnapshot: true,
    editionSnapshot: true,
    isbnSnapshot: true,
  },
} as const;

export const guestOrderListSelect = Prisma.validator<Prisma.OrderSelect>()({
  ...adminOrderListBaseSelect,
  address: true,
});

export const userOrderListSelect = Prisma.validator<Prisma.OrderSelect>()({
  ...adminOrderListBaseSelect,
  addressUser: true,
});

export const orderDetailSelect = Prisma.validator<Prisma.OrderSelect>()({
  items: {
    orderBy: [{ id: 'asc' }],
    select: {
      id: true,
      bookVariantSnapshotId: true,
      quantity: true,
      unitPrice: true,
      lineTotal: true,
      createdAt: true,
      bookVariantSnapshot: bookVariantSnapshotSelect,
    },
  },
});

export const orderStatusCheckSelect = Prisma.validator<Prisma.OrderSelect>()({
  id: true,
  status: true,
});

export type GuestOrderListRow = Prisma.OrderGetPayload<{
  select: typeof guestOrderListSelect;
}>;

export type UserOrderListRow = Prisma.OrderGetPayload<{
  select: typeof userOrderListSelect;
}>;

export type OrderDetailRow = Prisma.OrderGetPayload<{
  select: typeof orderDetailSelect;
}>;

export type OrderStatusCheckRow = Prisma.OrderGetPayload<{
  select: typeof orderStatusCheckSelect;
}>;
