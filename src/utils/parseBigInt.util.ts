import { BadRequestException } from '@nestjs/common';

export const parseBigIntRequired = (
    value: string | undefined,
    fieldName: string,
): bigint => {
    if (!value) {
        throw new BadRequestException(`${fieldName} is required`);
    }

    try {
        return BigInt(value);
    } catch {
        throw new BadRequestException(`${fieldName} must be a bigint`);
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
