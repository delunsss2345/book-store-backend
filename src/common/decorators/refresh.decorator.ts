import { SetMetadata } from "@nestjs/common";

export const IS_REFRESH_KEY = 'refresh-token';
export const Refresh = () => SetMetadata(IS_REFRESH_KEY, true);
