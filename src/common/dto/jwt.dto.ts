export type JwtPayload = {
    sub: string;
    isEmailVerified: boolean;
    roles: string[];
};
