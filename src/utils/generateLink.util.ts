import { VerifyCodePath } from "@/common";
import { randomInt } from "node:crypto";

export const generateLinkWithType = ({ url = 'http://localhost:3000', path, token }: { url?: string, path: VerifyCodePath, token: string }) => {
    return {
        link: `${url}/${path}?token=${token}`,
    }
}
export const generateOTP = () => String(randomInt(0, 100000)).padStart(5, "0");