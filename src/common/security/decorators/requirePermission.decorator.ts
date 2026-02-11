
import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permissionCode';
export const RequirePermissions = (permissionCode: PermissionCode) => SetMetadata(PERMISSION_KEY, permissionCode);
