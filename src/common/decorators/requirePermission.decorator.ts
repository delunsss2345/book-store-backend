
import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permissionCodes';
export const RequirePermissions = (...permissionCodes: PermissionCode[]) => SetMetadata(PERMISSION_KEY, permissionCodes);
