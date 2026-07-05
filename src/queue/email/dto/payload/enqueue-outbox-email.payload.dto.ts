export class EnqueueOutboxEmailPayloadDto {
  outboxId!: number;
  verificationCodeId!: number;
  originUrl?: string;
}
