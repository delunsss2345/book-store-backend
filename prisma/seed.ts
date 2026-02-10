import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, RoleCode } from '@prisma/client';
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter });

async function main() {
    const roles = [
        { code: RoleCode.ADMIN, name: 'admin', description: 'Full access' },
        { code: RoleCode.STAFF, name: 'staff', description: 'Backoffice staff' },
        { code: RoleCode.CUSTOMER, name: 'customer', description: 'End user' },
        { code: RoleCode.GUEST, name: 'guest', description: 'Guest user' },
        { code: RoleCode.WAREHOUSE, name: 'warehouse', description: 'Inventory staff' },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { code: role.code },
            update: { name: role.name, description: role.description, isActive: true },
            create: { ...role, isActive: true },
        });
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
