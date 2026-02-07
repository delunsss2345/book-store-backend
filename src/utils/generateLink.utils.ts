import { VerifyCodePath } from "@/common";
import { randomKey } from "@/utils/randomKey.utils";

export const generateLinkWithType = ({ url = 'http://localhost:3000', path }: { url?: string, path: VerifyCodePath }) => {
    const token = randomKey();
    return {
        link: `${url}/${path}?token={{token}}`,
        token
    }
}