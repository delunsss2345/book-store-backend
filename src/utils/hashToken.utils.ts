import bcrypt from 'bcrypt';

export const hashToken = (token: string) => {
    return bcrypt.hash(token, 10);
};
