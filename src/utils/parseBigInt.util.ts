import { RequestValidationMessage } from '@/common';
import { BadRequestException } from '@nestjs/common';

export const parseBigIntRequired = (
  value: string | undefined,
  fieldName: string,
): bigint => {
  if (!value) {
    throw new BadRequestException(
      RequestValidationMessage.FIELD_REQUIRED(fieldName),
    );
  }

  try {
    return BigInt(value);
  } catch {
    throw new BadRequestException(
      RequestValidationMessage.FIELD_MUST_BE_BIGINT(fieldName),
    );
  }
};

export const parseBigIntOptional = (
  value?: string | null,
): bigint | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    return BigInt(value);
  } catch {
    return undefined;
  }
};
