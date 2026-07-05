//
export const EventType = {
  VIEW_BOOK: 'VIEW_BOOK',
  SEARCH: 'SEARCH',
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  CHECKOUT_START: 'CHECKOUT_START',
  PLACE_ORDER: 'PLACE_ORDER',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

export const EVENT_WEIGHT: Record<EventType, number> = {
  VIEW_BOOK: 1,
  SEARCH: 0.2,
  ADD_TO_CART: 4,
  REMOVE_FROM_CART: -2,
  CHECKOUT_START: 6,
  PLACE_ORDER: 8,
  PAYMENT_SUCCESS: 12,
  PAYMENT_FAILED: -1,
  LOGIN: 0,
  LOGOUT: 0,
} as const;

// time decay: giảm theo số ngày trước đó
export function timeDecay(daysAgo: number): number {
  if (daysAgo <= 3) return 1.0;
  if (daysAgo <= 14) return 0.7;
  if (daysAgo <= 30) return 0.4;
  return 0.2;
}

// tính điểm 1 event thành “user-book score”
export function scoreEvent(args: {
  type: EventType;
  createdAt: Date;
  now?: Date;
}) {
  const now = args.now ?? new Date();
  const daysAgo = Math.floor(
    (now.getTime() - args.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  return EVENT_WEIGHT[args.type] * timeDecay(Math.max(0, daysAgo));
}
