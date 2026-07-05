import { VerifyCodePath } from "@/common";
import { randomInt } from "node:crypto";
type GenerateLinkArgs = {
    originUrl?: string;
    path: VerifyCodePath;
    token: string;
};

const getTokenParamKey = (path: VerifyCodePath) => {
    switch (path) {
        case VerifyCodePath.VERIFY_EMAIL:
            return "token";
        case VerifyCodePath.FORGOT_PASSWORD:
            return "forgot-password";
        case VerifyCodePath.RESET_PASSWORD:
            return "verify-token";
        case VerifyCodePath.CHANGE_EMAIL:
            return "change-email";
        default:
            return "token";
    }
};
export const generateLinkWithType = ({
    originUrl,
    path,
    token,
}: GenerateLinkArgs) => {
    const key = getTokenParamKey(path);

    const base = originUrl ? originUrl.endsWith("/") ? originUrl.slice(0, -1) : originUrl : 'http://localhost:3000/vi';
    return {
        link: `${base}/${path}?${key}=${encodeURIComponent(token)}`,
    };
};

export const generateOTP = () => String(randomInt(0, 100000)).padStart(5, "0");