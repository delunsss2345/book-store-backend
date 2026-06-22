// // prisma/seed-role-permissions.ts
// //
// // Seed RolePermission — gắn permission cho từng role theo RBAC.
// //
// // Ma trận phân quyền:
// //   ADMIN     → tất cả permission
// //   STAFF     → đọc/quản lý catalog, order, supplier, upload, auth cá nhân
// //   WAREHOUSE → xem supplier, xem admin books, upload, auth cá nhân
// //   CUSTOMER  → auth cá nhân
// //   GUEST     → auth cá nhân
// //
// // Cách chạy độc lập:
// //   npx ts-node prisma/seed-role-permissions.ts
// //
// // Hoặc gọi hàm seedRolePermissions() từ main seed.

// import { PermissionCode } from '@/common/constants/permission-pattern.constant';
// import { PrismaMariaDb } from '@prisma/adapter-mariadb';
// import { PrismaClient, RoleCode } from '@prisma/client';

// const adapter = new PrismaMariaDb({
//     host: process.env.DB_HOST ?? 'localhost',
//     port: Number(process.env.DB_PORT ?? 3308),
//     user: process.env.DB_USERNAME ?? 'root',
//     password: process.env.DB_PASSWORD ?? 'huy123',
//     database: process.env.DB_NAME ?? 'book_store',
//     connectionLimit: 5,
// });

// const prisma = new PrismaClient({ adapter });

// // ---------------------------------------------------------------------------
// // Ma trận phân quyền theo role
// // ---------------------------------------------------------------------------

// const AUTH_SELF_PERMISSIONS: PermissionCode[] = [
//     PermissionCode.AUTH_REGISTER,
//     PermissionCode.AUTH_LOGIN,
//     PermissionCode.AUTH_ME_READ,
//     PermissionCode.AUTH_TOKEN_REFRESH,
//     PermissionCode.AUTH_LOGOUT,
//     PermissionCode.AUTH_PASSWORD_FORGOT,
//     PermissionCode.AUTH_EMAIL_VERIFY,
//     PermissionCode.AUTH_EMAIL_RESEND,
//     PermissionCode.AUTH_PASSWORD_CHANGE,
//     PermissionCode.AUTH_PASSWORD_RESET_VALIDATE,
//     PermissionCode.AUTH_PASSWORD_RESET,
// ];

// const STAFF_PERMISSIONS: PermissionCode[] = [
//     ...AUTH_SELF_PERMISSIONS,
//     PermissionCode.HEALTH_READ,
//     PermissionCode.SUPPLIER_READ,
//     PermissionCode.SUPPLIER_CREATE,
//     PermissionCode.SUPPLIER_UPDATE,
//     PermissionCode.AUTHOR_CREATE,
//     PermissionCode.PUBLISHER_CREATE,
//     PermissionCode.CATEGORY_CREATE,
//     PermissionCode.ADMIN_CREATE_BOOK,
//     PermissionCode.ADMIN_CREATE_BOOK_ALL,
//     PermissionCode.ADMIN_UPDATE_BOOK,
//     PermissionCode.ADMIN_DELETE_BOOK,
//     PermissionCode.ADMIN_READ_DETAIL,
//     PermissionCode.ADMIN_READ,
//     PermissionCode.UPLOAD_MANAGE,
//     PermissionCode.DEVICE_READ,
//     PermissionCode.LOGIN_ATTEMPT_READ_BY_USER,
//     PermissionCode.EMAIL_OUTBOX_GET,
//     PermissionCode.GUEST_SESSION_GET_ALL,
//     PermissionCode.SEARCH_REINDEX_BOOKS,
// ];

// const WAREHOUSE_PERMISSIONS: PermissionCode[] = [
//     ...AUTH_SELF_PERMISSIONS,
//     PermissionCode.HEALTH_READ,
//     PermissionCode.SUPPLIER_READ,
//     PermissionCode.ADMIN_READ_DETAIL,
//     PermissionCode.ADMIN_READ,
//     PermissionCode.UPLOAD_MANAGE,
// ];

// const CUSTOMER_PERMISSIONS: PermissionCode[] = [...AUTH_SELF_PERMISSIONS];

// const GUEST_PERMISSIONS: PermissionCode[] = [...AUTH_SELF_PERMISSIONS];

// const ALL_PERMISSION_CODES: PermissionCode[] = Object.values(PermissionCode);

// // ---------------------------------------------------------------------------
// // Map role → danh sách permission codes
// // ---------------------------------------------------------------------------

// const ROLE_PERMISSION_MAP: Record<RoleCode, PermissionCode[]> = {
//     [RoleCode.ADMIN]: ALL_PERMISSION_CODES,
//     [RoleCode.STAFF]: STAFF_PERMISSIONS,
//     [RoleCode.WAREHOUSE]: WAREHOUSE_PERMISSIONS,
//     [RoleCode.CUSTOMER]: CUSTOMER_PERMISSIONS,
//     [RoleCode.GUEST]: GUEST_PERMISSIONS,
// };

// // ---------------------------------------------------------------------------
// // Core seed function
// // ---------------------------------------------------------------------------

// export async function seedRolePermissions() {
//     console.log('--- Seeding RolePermissions ---');

//     const roles = await prisma.role.findMany({
//         select: { id: true, code: true },
//     });

//     if (!roles.length) {
//         console.warn('[seed-role-permissions] No roles found. Run base seed first.');
//         return;
//     }

//     const roleByCode = new Map(roles.map((r) => [r.code, r.id]));

//     const permissions = await prisma.permission.findMany({
//         select: { id: true, code: true },
//     });

//     if (!permissions.length) {
//         console.warn('[seed-role-permissions] No permissions found. Run base seed first.');
//         return;
//     }

//     const permissionByCode = new Map(permissions.map((p) => [p.code, p.id]));

//     let totalGranted = 0;
//     let totalSkipped = 0;

//     for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSION_MAP) as [
//         RoleCode,
//         PermissionCode[],
//     ][]) {
//         const roleId = roleByCode.get(roleCode);
//         if (!roleId) {
//             console.warn(`  [skip] Role not found in DB: ${roleCode}`);
//             continue;
//         }

//         const uniqueCodes = [...new Set(permCodes)];

//         for (const permCode of uniqueCodes) {
//             const permissionId = permissionByCode.get(permCode);
//             if (!permissionId) {
//                 console.warn(`  [skip] Permission code not found in DB: ${permCode}`);
//                 totalSkipped++;
//                 continue;
//             }

//             await prisma.rolePermission.upsert({
//                 where: { roleId_permissionId: { roleId, permissionId } },
//                 update: {},
//                 create: { roleId, permissionId },
//             });

//             totalGranted++;
//         }

//         console.log(`  Role ${roleCode.padEnd(12)} → granted ${uniqueCodes.length} permissions`);
//     }

//     console.log(
//         `--- RolePermission seed done: ${totalGranted} granted, ${totalSkipped} skipped ---`,
//     );
// }

// // ---------------------------------------------------------------------------
// // Run standalone
// // ---------------------------------------------------------------------------

// async function main() {
//     await seedRolePermissions();
// }

// main()
//     .catch((e) => {
//         console.error(e);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });