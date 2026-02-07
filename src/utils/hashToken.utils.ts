import { createHash } from 'crypto';

export const hashToken = async (token: string) => {
    return createHash('sha256').update(token).digest('hex');
};

export const tokenHash = hashToken;
