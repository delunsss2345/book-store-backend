// prisma/seed.ts
import { PermissionCode } from "@/common/constants/permission-pattern.constant";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, RoleCode, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

type SeedUser = {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    isEmailVerified?: boolean;
    status?: UserStatus;
    roleCodes: RoleCode[];
};

type SeedPermission = {
    code: PermissionCode;
    description?: string;
    method: string;       // khớp enum HTTPMethod của bạn (GET/POST/PATCH/DELETE)
    pathPattern: string;
    isActive?: boolean;
};


async function upsertRoles() {
    const roles = [
        { code: RoleCode.ADMIN, name: "admin", description: "Full access" },
        { code: RoleCode.STAFF, name: "staff", description: "Backoffice staff" },
        { code: RoleCode.CUSTOMER, name: "customer", description: "End user" },
        { code: RoleCode.GUEST, name: "guest", description: "Guest user" },
        { code: RoleCode.WAREHOUSE, name: "warehouse", description: "Inventory staff" },
    ];

    for (const r of roles) {
        await prisma.role.upsert({
            where: { code: r.code },
            update: {
                name: r.name,
                description: r.description,
                isActive: true,
            },
            create: {
                code: r.code,
                name: r.name,
                description: r.description,
                isActive: true,
            },
        });
    }

    const roleRows = await prisma.role.findMany({ select: { id: true, code: true } });
    return new Map(roleRows.map((x) => [x.code, x.id] as const));
}


async function upsertPermissions() {
    const permissions: SeedPermission[] = [
        // Health
        { code: PermissionCode.HEALTH_READ, method: "GET", pathPattern: "/api/v1/health", description: "Read service health" },

        // Role
        { code: PermissionCode.ROLE_READ, method: "GET", pathPattern: "/api/v1/role", description: "List roles" },
        { code: PermissionCode.ROLE_READ_ONE, method: "GET", pathPattern: "/api/v1/role/:name", description: "Get role by name" },

        // Permission CRUD
        { code: PermissionCode.PERMISSION_READ, method: "GET", pathPattern: "/api/v1/permission", description: "List permissions" },
        { code: PermissionCode.PERMISSION_CREATE, method: "POST", pathPattern: "/api/v1/permission", description: "Create permission" },
        { code: PermissionCode.PERMISSION_UPDATE, method: "PATCH", pathPattern: "/api/v1/permission/:id", description: "Update permission" },
        { code: PermissionCode.PERMISSION_DELETE, method: "DELETE", pathPattern: "/api/v1/permission/:id", description: "Delete permission" },

        // Role-Permission mapping
        { code: PermissionCode.ROLE_PERMISSION_GRANT, method: "POST", pathPattern: "/api/v1/role-permission", description: "Grant permission to role" },
        { code: PermissionCode.ROLE_PERMISSION_READ_BY_ROLE, method: "GET", pathPattern: "/api/v1/role-permission/role/:roleId", description: "List permissions of a role" },
        { code: PermissionCode.ROLE_PERMISSION_READ_BY_PERMISSION, method: "GET", pathPattern: "/api/v1/role-permission/permission/:permissionId", description: "List roles that have a permission" },

        // Device
        { code: PermissionCode.DEVICE_READ, method: "GET", pathPattern: "/api/v1/device", description: "List devices" },
        { code: PermissionCode.LOGIN_ATTEMPT_READ_BY_USER, method: "GET", pathPattern: "/api/v1/login-attempt/user/:userId", description: "List login attempts by user id" },
        { code: PermissionCode.EMAIL_OUTBOX_GET, method: "GET", pathPattern: "/api/v1/email-outbox", description: "List OTP email outbox by filter" },

        // Auth
        { code: PermissionCode.AUTH_REGISTER, method: "POST", pathPattern: "/api/v1/auth/register", description: "Register user" },
        { code: PermissionCode.AUTH_LOGIN, method: "POST", pathPattern: "/api/v1/auth/login", description: "Login" },
        { code: PermissionCode.AUTH_ME_READ, method: "GET", pathPattern: "/api/v1/auth/me", description: "Get current user profile" },
        { code: PermissionCode.AUTH_TOKEN_REFRESH, method: "POST", pathPattern: "/api/v1/auth/refresh-token", description: "Refresh access token" },
        { code: PermissionCode.AUTH_LOGOUT, method: "POST", pathPattern: "/api/v1/auth/logout", description: "Logout" },
        { code: PermissionCode.AUTH_PASSWORD_FORGOT, method: "POST", pathPattern: "/api/v1/auth/forgot-password", description: "Request password reset" },
        { code: PermissionCode.AUTH_EMAIL_VERIFY, method: "GET", pathPattern: "/api/v1/auth/verify-email", description: "Verify email" },
        { code: PermissionCode.AUTH_EMAIL_RESEND, method: "POST", pathPattern: "/api/v1/auth/resend-email", description: "Resend verification email" },
        { code: PermissionCode.AUTH_PASSWORD_CHANGE, method: "POST", pathPattern: "/api/v1/auth/change-password", description: "Change password" },
        { code: PermissionCode.AUTH_PASSWORD_RESET_VALIDATE, method: "POST", pathPattern: "/api/v1/auth/reset-password/validate", description: "Validate reset password token" },
        { code: PermissionCode.AUTH_PASSWORD_RESET, method: "POST", pathPattern: "/api/v1/auth/reset-password", description: "Reset password" },
    ];

    for (const p of permissions) {
        await prisma.permission.upsert({
            where: { code: p.code },
            update: {
                description: p.description,
                method: p.method as any,
                pathPattern: p.pathPattern,
                isActive: p.isActive ?? true,
                deletedAt: null,
            },
            create: {
                code: p.code,
                description: p.description,
                method: p.method as any,
                pathPattern: p.pathPattern,
                isActive: p.isActive ?? true,
            },
        });
    }

    const permissionRows = await prisma.permission.findMany({ select: { id: true, code: true } });
    return new Map(permissionRows.map((x) => [x.code as PermissionCode, x.id] as const));
}

async function upsertUserWithRoles(user: SeedUser, roleIdByCode: Map<RoleCode, bigint>) {
    const hashed = await bcrypt.hash(user.password, 12);

    const u = await prisma.user.upsert({
        where: { email: user.email },
        update: {
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            isEmailVerified: user.isEmailVerified ?? false,
            status: user.status ?? UserStatus.ACTIVE,
            password: hashed,
            passwordChangedAt: new Date(),
            deletedAt: null,
        },
        create: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            isEmailVerified: user.isEmailVerified ?? true,
            status: user.status ?? UserStatus.ACTIVE,
            password: hashed,
            passwordChangedAt: new Date(),
            verifyEmailAt: user.isEmailVerified ? new Date() : null,
        },
        select: { id: true, email: true },
    });

    // idempotent: reset roles của user
    await prisma.userRole.deleteMany({ where: { userId: u.id } });

    const roleIds = user.roleCodes.map((code) => {
        const id = roleIdByCode.get(code);
        if (!id) throw new Error(`Role not found for code=${code}`);
        return id;
    });

    await prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: u.id, roleId })),
        skipDuplicates: true,
    });

    return u;
}

async function upsertRolePermissions(
    roleIdByCode: Map<RoleCode, bigint>,
    permissionIdByCode: Map<PermissionCode, bigint>
) {
    // mapping role -> permissions
    const rolePermissionMap: Record<RoleCode, PermissionCode[]> = {
        [RoleCode.ADMIN]: Object.values(PermissionCode), // admin full (tạm thời)
        [RoleCode.STAFF]: [
            PermissionCode.HEALTH_READ,
            PermissionCode.DEVICE_READ,

            PermissionCode.ROLE_READ,
            PermissionCode.ROLE_READ_ONE,

            PermissionCode.PERMISSION_READ,
            // staff không được tạo/xoá permission (tuỳ bạn)
            PermissionCode.ROLE_PERMISSION_READ_BY_ROLE,
            PermissionCode.ROLE_PERMISSION_READ_BY_PERMISSION,
            // có cho staff grant permission hay không tuỳ policy:
            // PermissionCode.ROLE_PERMISSION_GRANT,
        ],
        [RoleCode.WAREHOUSE]: [PermissionCode.HEALTH_READ, PermissionCode.DEVICE_READ],
        [RoleCode.CUSTOMER]: [PermissionCode.HEALTH_READ, PermissionCode.DEVICE_READ],
        [RoleCode.GUEST]: [PermissionCode.HEALTH_READ],
    };

    for (const [roleCode, permissionCodes] of Object.entries(rolePermissionMap) as [RoleCode, PermissionCode[]][]) {
        const roleId = roleIdByCode.get(roleCode);
        if (!roleId) throw new Error(`Role not found for code=${roleCode}`);

        // idempotent: reset permissions của role
        await prisma.rolePermission.deleteMany({ where: { roleId } });

        const permissionIds = permissionCodes.map((c) => {
            const id = permissionIdByCode.get(c);
            if (!id) throw new Error(`Permission not found for code=${c}`);
            return id;
        });

        await prisma.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
            skipDuplicates: true,
        });
    }
}

async function main() {
    const roleIdByCode = await upsertRoles();
    const permissionIdByCode = await upsertPermissions();
    await upsertRolePermissions(roleIdByCode, permissionIdByCode);

    const users: SeedUser[] = [
        {
            email: "admin@admin.com",
            password: "admin1234",
            firstName: "System",
            lastName: "Admin",
            isEmailVerified: true,
            roleCodes: [RoleCode.ADMIN],
        },
        {
            email: "staff1@example.com",
            password: "staff1234",
            firstName: "Nguyen",
            lastName: "Staff",
            isEmailVerified: true,
            roleCodes: [RoleCode.STAFF],
        },
        {
            email: "customer1@example.com",
            password: "customer1234",
            firstName: "Tran",
            lastName: "Customer",
            isEmailVerified: true,
            roleCodes: [RoleCode.CUSTOMER],
        },
        {
            email: "warehouse1@example.com",
            password: "warehouse1234",
            firstName: "Le",
            lastName: "Warehouse",
            isEmailVerified: true,
            roleCodes: [RoleCode.WAREHOUSE],
        },
        {
            email: "guest1@example.com",
            password: "guest1234",
            firstName: "Guest",
            lastName: "User",
            isEmailVerified: false,
            roleCodes: [RoleCode.GUEST],
        },
    ];

    for (const user of users) {
        const u = await upsertUserWithRoles(user, roleIdByCode);
        console.log(`Seeded user: ${u.email}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
