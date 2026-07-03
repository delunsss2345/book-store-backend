export const EMAIL_QUEUE = {
  NAME: 'email',
} as const;

export const EMAIL_JOBS = {
  SEND_EMAIL: 'EMAIL_JOBS.SEND_EMAIL',
  SEND_ORDER_EMAIL: 'EMAIL_JOBS.SEND_ORDER_EMAIL',
} as const;

export const EMAIL_JOB_ID_PREFIX = {
  OUTBOX: 'email',
  ORDER: 'order-email',
} as const;
