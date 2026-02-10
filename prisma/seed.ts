// prisma/seed.ts
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

async function main() {
    const roleIdByCode = await upsertRoles();

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
