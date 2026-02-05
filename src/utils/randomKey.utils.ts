import { randomBytes } from "crypto";

export const randomKey = () => {
    return randomBytes(64).toString('hex');
}