// prisma/seed.ts
import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
    BookFormat,
    OrderStatus,
    PaymentGateway,
    PaymentStatus,
    PrismaClient,
    RoleCode,
    UserStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

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
    method: string;
    pathPattern: string;
    isActive?: boolean;
};

type SeedCategory = {
    slug: string;
    sortOrder: number;
    viName: string;
    enName: string;
    parentSlug?: string;
};

type SeedBook = {
    slug: string;
    viTitle: string;
    enTitle: string;
    viDescription: string;
    enDescription: string;
    coverImageUrl: string;
    publicationYear: number;
    pageCount: number;
    weightGrams: number;
    publisherName: string;
    categories: string[];
    variants: Array<{
        format: BookFormat;
        edition?: number;
        isbn: string;
        price: number;
        currencyCode: string;
        stock: number;
    }>;
};

async function upsertRoles() {
    const roles = [
        { code: RoleCode.ADMIN, name: 'admin', description: 'Full access' },
        { code: RoleCode.STAFF, name: 'staff', description: 'Backoffice staff' },
        { code: RoleCode.CUSTOMER, name: 'customer', description: 'End user' },
        { code: RoleCode.GUEST, name: 'guest', description: 'Guest user' },
        { code: RoleCode.WAREHOUSE, name: 'warehouse', description: 'Inventory staff' },
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
        { code: PermissionCode.HEALTH_READ, method: 'GET', pathPattern: '/api/v1/health', description: 'Read service health' },

        { code: PermissionCode.ROLE_READ, method: 'GET', pathPattern: '/api/v1/role', description: 'List roles' },
        { code: PermissionCode.ROLE_READ_ONE, method: 'GET', pathPattern: '/api/v1/role/:name', description: 'Get role by name' },

        { code: PermissionCode.PERMISSION_READ, method: 'GET', pathPattern: '/api/v1/permission', description: 'List permissions' },
        { code: PermissionCode.PERMISSION_CREATE, method: 'POST', pathPattern: '/api/v1/permission', description: 'Create permission' },
        { code: PermissionCode.PERMISSION_UPDATE, method: 'PATCH', pathPattern: '/api/v1/permission/:id', description: 'Update permission' },
        { code: PermissionCode.PERMISSION_DELETE, method: 'DELETE', pathPattern: '/api/v1/permission/:id', description: 'Delete permission' },

        { code: PermissionCode.ROLE_PERMISSION_GRANT, method: 'POST', pathPattern: '/api/v1/role-permission', description: 'Grant permission to role' },
        { code: PermissionCode.ROLE_PERMISSION_READ_BY_ROLE, method: 'GET', pathPattern: '/api/v1/role-permission/role/:roleId', description: 'List permissions of a role' },
        { code: PermissionCode.ROLE_PERMISSION_READ_BY_PERMISSION, method: 'GET', pathPattern: '/api/v1/role-permission/permission/:permissionId', description: 'List roles that have a permission' },

        { code: PermissionCode.DEVICE_READ, method: 'GET', pathPattern: '/api/v1/device', description: 'List devices' },
        { code: PermissionCode.LOGIN_ATTEMPT_READ_BY_USER, method: 'GET', pathPattern: '/api/v1/login-attempt/user/:userId', description: 'List login attempts by user id' },
        { code: PermissionCode.EMAIL_OUTBOX_GET, method: 'GET', pathPattern: '/api/v1/email-outbox', description: 'List OTP email outbox by filter' },

        { code: PermissionCode.AUTH_REGISTER, method: 'POST', pathPattern: '/api/v1/auth/register', description: 'Register user' },
        { code: PermissionCode.AUTH_LOGIN, method: 'POST', pathPattern: '/api/v1/auth/login', description: 'Login' },
        { code: PermissionCode.AUTH_ME_READ, method: 'GET', pathPattern: '/api/v1/auth/me', description: 'Get current user profile' },
        { code: PermissionCode.AUTH_TOKEN_REFRESH, method: 'POST', pathPattern: '/api/v1/auth/refresh-token', description: 'Refresh access token' },
        { code: PermissionCode.AUTH_LOGOUT, method: 'POST', pathPattern: '/api/v1/auth/logout', description: 'Logout' },
        { code: PermissionCode.AUTH_PASSWORD_FORGOT, method: 'POST', pathPattern: '/api/v1/auth/forgot-password', description: 'Request password reset' },
        { code: PermissionCode.AUTH_EMAIL_VERIFY, method: 'GET', pathPattern: '/api/v1/auth/verify-email', description: 'Verify email' },
        { code: PermissionCode.AUTH_EMAIL_RESEND, method: 'POST', pathPattern: '/api/v1/auth/resend-email', description: 'Resend verification email' },
        { code: PermissionCode.AUTH_PASSWORD_CHANGE, method: 'POST', pathPattern: '/api/v1/auth/change-password', description: 'Change password' },
        { code: PermissionCode.AUTH_PASSWORD_RESET_VALIDATE, method: 'POST', pathPattern: '/api/v1/auth/reset-password/validate', description: 'Validate reset password token' },
        { code: PermissionCode.AUTH_PASSWORD_RESET, method: 'POST', pathPattern: '/api/v1/auth/reset-password', description: 'Reset password' },
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

async function upsertLanguages() {
    const languages = [
        { code: 'en', name: 'English', isActive: true },
        { code: 'vi', name: 'Tiếng Việt', isActive: true },
    ];

    for (const l of languages) {
        await prisma.language.upsert({
            where: { code: l.code },
            update: {
                name: l.name,
                isActive: l.isActive,
            },
            create: {
                code: l.code,
                name: l.name,
                isActive: l.isActive,
            },
        });
    }

    const rows = await prisma.language.findMany({ select: { id: true, code: true } });
    return new Map(rows.map((row) => [row.code, row.id] as const));
}

async function upsertRolePermissions(
    roleIdByCode: Map<RoleCode, bigint>,
    permissionIdByCode: Map<PermissionCode, bigint>,
) {
    const rolePermissionMap: Record<RoleCode, PermissionCode[]> = {
        [RoleCode.ADMIN]: Object.values(PermissionCode),
        [RoleCode.STAFF]: [
            PermissionCode.HEALTH_READ,
            PermissionCode.DEVICE_READ,
            PermissionCode.ROLE_READ,
            PermissionCode.ROLE_READ_ONE,
            PermissionCode.PERMISSION_READ,
            PermissionCode.ROLE_PERMISSION_READ_BY_ROLE,
            PermissionCode.ROLE_PERMISSION_READ_BY_PERMISSION,
        ],
        [RoleCode.WAREHOUSE]: [PermissionCode.HEALTH_READ, PermissionCode.DEVICE_READ],
        [RoleCode.CUSTOMER]: [PermissionCode.HEALTH_READ, PermissionCode.DEVICE_READ],
        [RoleCode.GUEST]: [PermissionCode.HEALTH_READ],
    };

    for (const [roleCode, permissionCodes] of Object.entries(rolePermissionMap) as [RoleCode, PermissionCode[]][]) {
        const roleId = roleIdByCode.get(roleCode);
        if (!roleId) throw new Error(`Role not found for code=${roleCode}`);

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

async function upsertPublisherByName(defaultName: string) {
    const existing = await prisma.publisher.findFirst({
        where: { defaultName },
        select: { id: true },
    });

    if (existing) {
        return existing.id;
    }

    const created = await prisma.publisher.create({
        data: { defaultName },
        select: { id: true },
    });

    return created.id;
}

async function upsertCatalogCategories(languageIdByCode: Map<string, number>) {
    const categories: SeedCategory[] = [
        { slug: 'programming', sortOrder: 1, viName: 'Lập trình', enName: 'Programming' },
        { slug: 'architecture', sortOrder: 2, viName: 'Kiến trúc phần mềm', enName: 'Architecture' },
        { slug: 'devops', sortOrder: 3, viName: 'DevOps', enName: 'DevOps' },
        { slug: 'backend', sortOrder: 4, viName: 'Backend', enName: 'Backend', parentSlug: 'programming' },
        { slug: 'frontend', sortOrder: 5, viName: 'Frontend', enName: 'Frontend', parentSlug: 'programming' },
    ];

    const viLanguageId = languageIdByCode.get('vi');
    const enLanguageId = languageIdByCode.get('en');
    if (!viLanguageId || !enLanguageId) {
        throw new Error('Missing vi/en language seed');
    }

    const categoryIdBySlug = new Map<string, bigint>();

    for (const category of categories) {
        const parentId = category.parentSlug ? categoryIdBySlug.get(category.parentSlug) : null;

        const existing = await prisma.categoryTranslation.findFirst({
            where: {
                languageId: viLanguageId,
                slug: category.slug,
            },
            select: {
                categoryId: true,
            },
        });

        let categoryId: bigint;
        if (existing) {
            categoryId = existing.categoryId;
            await prisma.category.update({
                where: { id: categoryId },
                data: {
                    parentId,
                    isActive: true,
                    sortOrder: category.sortOrder,
                    deletedAt: null,
                },
            });
        } else {
            const created = await prisma.category.create({
                data: {
                    parentId,
                    isActive: true,
                    sortOrder: category.sortOrder,
                },
                select: {
                    id: true,
                },
            });
            categoryId = created.id;
        }

        await prisma.categoryTranslation.upsert({
            where: {
                categoryId_languageId: {
                    categoryId,
                    languageId: viLanguageId,
                },
            },
            update: {
                name: category.viName,
                slug: category.slug,
            },
            create: {
                categoryId,
                languageId: viLanguageId,
                name: category.viName,
                slug: category.slug,
            },
        });

        await prisma.categoryTranslation.upsert({
            where: {
                categoryId_languageId: {
                    categoryId,
                    languageId: enLanguageId,
                },
            },
            update: {
                name: category.enName,
                slug: category.slug,
            },
            create: {
                categoryId,
                languageId: enLanguageId,
                name: category.enName,
                slug: category.slug,
            },
        });

        categoryIdBySlug.set(category.slug, categoryId);
    }

    return categoryIdBySlug;
}

async function upsertCatalogBooks(
    languageIdByCode: Map<string, number>,
    categoryIdBySlug: Map<string, bigint>,
) {
    const books: SeedBook[] = [
        {
            slug: 'clean-code',
            viTitle: 'Clean Code',
            enTitle: 'Clean Code',
            viDescription: 'Nguyên tắc viết mã sạch, dễ bảo trì và dễ mở rộng.',
            enDescription: 'A handbook of agile software craftsmanship.',
            coverImageUrl: 'https://images.example.com/books/clean-code.jpg',
            publicationYear: 2008,
            pageCount: 464,
            weightGrams: 740,
            publisherName: 'Prentice Hall',
            categories: ['programming', 'backend'],
            variants: [
                { format: BookFormat.PAPERBACK, edition: 1, isbn: '9780132350884', price: 29.99, currencyCode: 'USD', stock: 120 },
            ],
        },
        {
            slug: 'ddd',
            viTitle: 'Domain-Driven Design',
            enTitle: 'Domain-Driven Design',
            viDescription: 'Thiết kế phần mềm tập trung vào domain và business.',
            enDescription: 'Tackling complexity in the heart of software.',
            coverImageUrl: 'https://images.example.com/books/ddd.jpg',
            publicationYear: 2003,
            pageCount: 560,
            weightGrams: 950,
            publisherName: 'Addison-Wesley',
            categories: ['architecture', 'backend'],
            variants: [
                { format: BookFormat.HARDCOVER, edition: 1, isbn: '9780321125217', price: 54.99, currencyCode: 'USD', stock: 60 },
            ],
        },
        {
            slug: 'system-design-interview',
            viTitle: 'System Design Interview',
            enTitle: 'System Design Interview',
            viDescription: 'Hướng dẫn thiết kế hệ thống cho phỏng vấn.',
            enDescription: 'An insider\'s guide for scalable system design interviews.',
            coverImageUrl: 'https://images.example.com/books/system-design.jpg',
            publicationYear: 2020,
            pageCount: 322,
            weightGrams: 500,
            publisherName: 'ByteByteGo',
            categories: ['architecture', 'backend'],
            variants: [
                { format: BookFormat.PAPERBACK, edition: 2, isbn: '9781736049112', price: 39.99, currencyCode: 'USD', stock: 140 },
            ],
        },
        {
            slug: 'refactoring',
            viTitle: 'Refactoring',
            enTitle: 'Refactoring',
            viDescription: 'Cải tiến codebase an toàn theo từng bước nhỏ.',
            enDescription: 'Improving the design of existing code.',
            coverImageUrl: 'https://images.example.com/books/refactoring.jpg',
            publicationYear: 2018,
            pageCount: 448,
            weightGrams: 760,
            publisherName: 'Addison-Wesley',
            categories: ['programming', 'backend'],
            variants: [
                { format: BookFormat.PAPERBACK, edition: 2, isbn: '9780134757599', price: 44.99, currencyCode: 'USD', stock: 90 },
            ],
        },
        {
            slug: 'designing-data-intensive-applications',
            viTitle: 'Designing Data-Intensive Applications',
            enTitle: 'Designing Data-Intensive Applications',
            viDescription: 'Tài liệu nền tảng về hệ thống dữ liệu phân tán.',
            enDescription: 'The big ideas behind reliable, scalable, maintainable systems.',
            coverImageUrl: 'https://images.example.com/books/ddia.jpg',
            publicationYear: 2017,
            pageCount: 616,
            weightGrams: 980,
            publisherName: 'O\'Reilly Media',
            categories: ['architecture', 'backend'],
            variants: [
                { format: BookFormat.PAPERBACK, edition: 1, isbn: '9781449373320', price: 49.99, currencyCode: 'USD', stock: 70 },
            ],
        },
        {
            slug: 'effective-typescript',
            viTitle: 'Effective TypeScript',
            enTitle: 'Effective TypeScript',
            viDescription: '62 cách nâng cao chất lượng TypeScript trong thực tế.',
            enDescription: '62 specific ways to improve your TypeScript.',
            coverImageUrl: 'https://images.example.com/books/effective-ts.jpg',
            publicationYear: 2019,
            pageCount: 250,
            weightGrams: 420,
            publisherName: 'O\'Reilly Media',
            categories: ['programming', 'frontend'],
            variants: [
                { format: BookFormat.PAPERBACK, edition: 1, isbn: '9781492053743', price: 34.99, currencyCode: 'USD', stock: 115 },
            ],
        },
    ];

    const viLanguageId = languageIdByCode.get('vi');
    const enLanguageId = languageIdByCode.get('en');
    if (!viLanguageId || !enLanguageId) {
        throw new Error('Missing vi/en language seed');
    }

    const bookIdBySlug = new Map<string, bigint>();

    for (const book of books) {
        const publisherId = await upsertPublisherByName(book.publisherName);

        const existingTranslation = await prisma.bookTranslation.findFirst({
            where: {
                languageId: viLanguageId,
                slug: book.slug,
            },
            select: { bookId: true },
        });

        let bookId: bigint;
        if (existingTranslation) {
            bookId = existingTranslation.bookId;
            await prisma.book.update({
                where: { id: bookId },
                data: {
                    publisherId,
                    publicationYear: book.publicationYear,
                    pageCount: book.pageCount,
                    weightGrams: book.weightGrams,
                    coverImageUrl: book.coverImageUrl,
                    isActive: true,
                    deletedAt: null,
                },
            });
        } else {
            const created = await prisma.book.create({
                data: {
                    publisherId,
                    publicationYear: book.publicationYear,
                    pageCount: book.pageCount,
                    weightGrams: book.weightGrams,
                    coverImageUrl: book.coverImageUrl,
                    isActive: true,
                },
                select: { id: true },
            });
            bookId = created.id;
        }

        await prisma.bookTranslation.upsert({
            where: {
                bookId_languageId: {
                    bookId,
                    languageId: viLanguageId,
                },
            },
            update: {
                title: book.viTitle,
                description: book.viDescription,
                slug: book.slug,
            },
            create: {
                bookId,
                languageId: viLanguageId,
                title: book.viTitle,
                description: book.viDescription,
                slug: book.slug,
            },
        });

        await prisma.bookTranslation.upsert({
            where: {
                bookId_languageId: {
                    bookId,
                    languageId: enLanguageId,
                },
            },
            update: {
                title: book.enTitle,
                description: book.enDescription,
                slug: book.slug,
            },
            create: {
                bookId,
                languageId: enLanguageId,
                title: book.enTitle,
                description: book.enDescription,
                slug: book.slug,
            },
        });

        await prisma.bookCategory.deleteMany({ where: { bookId } });
        await prisma.bookCategory.createMany({
            data: book.categories.map((categorySlug) => {
                const categoryId = categoryIdBySlug.get(categorySlug);
                if (!categoryId) {
                    throw new Error(`Missing category for slug=${categorySlug}`);
                }
                return {
                    bookId,
                    categoryId,
                };
            }),
            skipDuplicates: true,
        });

        for (const variant of book.variants) {
            await prisma.bookVariant.upsert({
                where: { isbn: variant.isbn },
                update: {
                    bookId,
                    format: variant.format,
                    edition: variant.edition ?? null,
                    price: variant.price,
                    currencyCode: variant.currencyCode,
                    stock: variant.stock,
                    isActive: true,
                },
                create: {
                    bookId,
                    format: variant.format,
                    edition: variant.edition ?? null,
                    isbn: variant.isbn,
                    price: variant.price,
                    currencyCode: variant.currencyCode,
                    stock: variant.stock,
                    isActive: true,
                },
            });
        }

        bookIdBySlug.set(book.slug, bookId);
    }

    return bookIdBySlug;
}

async function upsertDemoReviews(bookIdBySlug: Map<string, bigint>) {
    const users = await prisma.user.findMany({
        where: {
            email: {
                in: ['customer1@example.com', 'staff1@example.com'],
            },
        },
        select: {
            id: true,
            email: true,
        },
    });

    const userIdByEmail = new Map(users.map((user) => [user.email, user.id] as const));
    const seededBookIds = [...bookIdBySlug.values()];

    await prisma.review.deleteMany({
        where: {
            content: {
                startsWith: '[seed] ',
            },
            bookId: {
                in: seededBookIds,
            },
        },
    });

    const reviewInputs = [
        { email: 'customer1@example.com', bookSlug: 'clean-code', rating: 5, content: '[seed] Must-read for engineers.' },
        { email: 'customer1@example.com', bookSlug: 'ddd', rating: 4, content: '[seed] Great for understanding complex domain.' },
        { email: 'customer1@example.com', bookSlug: 'system-design-interview', rating: 5, content: '[seed] Practical and concise.' },
        { email: 'staff1@example.com', bookSlug: 'effective-typescript', rating: 4, content: '[seed] Very actionable TypeScript tips.' },
        { email: 'staff1@example.com', bookSlug: 'designing-data-intensive-applications', rating: 5, content: '[seed] Excellent architecture reference.' },
    ];

    const data = reviewInputs
        .map((item) => {
            const userId = userIdByEmail.get(item.email);
            const bookId = bookIdBySlug.get(item.bookSlug);
            if (!userId || !bookId) {
                return null;
            }
            return {
                userId,
                bookId,
                rating: item.rating,
                content: item.content,
            };
        })
        .filter(Boolean) as Array<{ userId: bigint; bookId: bigint; rating: number; content: string }>;

    if (data.length) {
        await prisma.review.createMany({ data });
    }
}

async function upsertDemoOrders(bookIdBySlug: Map<string, bigint>, languageIdByCode: Map<string, number>) {
    const viLanguageId = languageIdByCode.get('vi');
    if (!viLanguageId) {
        throw new Error('Missing vi language seed');
    }

    const customer = await prisma.user.findUnique({
        where: { email: 'customer1@example.com' },
        select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true },
    });

    if (!customer) {
        throw new Error('Missing customer1@example.com user');
    }

    const seedOrders = [
        {
            orderCode: 'SEED-ORDER-0001',
            itemSpecs: [
                { bookSlug: 'clean-code', quantity: 3 },
                { bookSlug: 'system-design-interview', quantity: 2 },
            ],
        },
        {
            orderCode: 'SEED-ORDER-0002',
            itemSpecs: [
                { bookSlug: 'designing-data-intensive-applications', quantity: 4 },
                { bookSlug: 'effective-typescript', quantity: 2 },
            ],
        },
        {
            orderCode: 'SEED-ORDER-0003',
            itemSpecs: [
                { bookSlug: 'clean-code', quantity: 1 },
                { bookSlug: 'refactoring', quantity: 2 },
            ],
        },
    ];

    for (const seedOrder of seedOrders) {
        const itemDetails = [] as Array<{
            bookId: bigint;
            variantId: bigint;
            quantity: number;
            unitPrice: number;
            lineTotal: number;
            titleSnapshot: string;
            formatSnapshot: BookFormat;
            editionSnapshot: number | null;
            coverImageUrlSnapshot: string | null;
        }>;

        for (const item of seedOrder.itemSpecs) {
            const bookId = bookIdBySlug.get(item.bookSlug);
            if (!bookId) {
                throw new Error(`Missing book slug ${item.bookSlug}`);
            }

            const book = await prisma.book.findUnique({
                where: { id: bookId },
                select: {
                    id: true,
                    coverImageUrl: true,
                    translations: {
                        where: { languageId: viLanguageId },
                        select: { title: true },
                        take: 1,
                    },
                    variants: {
                        where: { isActive: true },
                        orderBy: [{ price: 'asc' }, { id: 'asc' }],
                        select: {
                            id: true,
                            price: true,
                            format: true,
                            edition: true,
                        },
                        take: 1,
                    },
                },
            });

            const variant = book?.variants[0];
            if (!book || !variant) {
                continue;
            }

            const unitPrice = Number(variant.price);
            itemDetails.push({
                bookId,
                variantId: variant.id,
                quantity: item.quantity,
                unitPrice,
                lineTotal: unitPrice * item.quantity,
                titleSnapshot: book.translations[0]?.title ?? `Book ${bookId.toString()}`,
                formatSnapshot: variant.format,
                editionSnapshot: variant.edition,
                coverImageUrlSnapshot: book.coverImageUrl,
            });
        }

        const subtotal = itemDetails.reduce((sum, row) => sum + row.lineTotal, 0);

        const order = await prisma.order.upsert({
            where: { orderCode: seedOrder.orderCode },
            update: {
                userId: customer.id,
                status: OrderStatus.DELIVERED,
                paymentStatus: PaymentStatus.SUCCESS,
                subtotal,
                discountAmount: 0,
                shippingFee: 0,
                totalAmount: subtotal,
                currencyCode: 'USD',
                placedAt: new Date(),
            },
            create: {
                orderCode: seedOrder.orderCode,
                userId: customer.id,
                status: OrderStatus.DELIVERED,
                paymentStatus: PaymentStatus.SUCCESS,
                subtotal,
                discountAmount: 0,
                shippingFee: 0,
                totalAmount: subtotal,
                currencyCode: 'USD',
                placedAt: new Date(),
            },
            select: {
                id: true,
            },
        });

        await prisma.orderAddress.upsert({
            where: {
                orderId: order.id,
            },
            update: {
                recipientName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer',
                phoneNumber: customer.phoneNumber ?? '0900000000',
                addressLine: '123 Seed Street',
                ward: 'Ward 1',
                district: 'District 1',
                city: 'Ho Chi Minh City',
                countryCode: 'VN',
                note: 'Seeded order address',
            },
            create: {
                orderId: order.id,
                recipientName: `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Customer',
                phoneNumber: customer.phoneNumber ?? '0900000000',
                addressLine: '123 Seed Street',
                ward: 'Ward 1',
                district: 'District 1',
                city: 'Ho Chi Minh City',
                countryCode: 'VN',
                note: 'Seeded order address',
            },
        });

        await prisma.orderItem.deleteMany({
            where: { orderId: order.id },
        });

        if (itemDetails.length) {
            await prisma.orderItem.createMany({
                data: itemDetails.map((item) => ({
                    orderId: order.id,
                    bookVariantId: item.variantId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    lineTotal: item.lineTotal,
                    titleSnapshot: item.titleSnapshot,
                    formatSnapshot: item.formatSnapshot,
                    editionSnapshot: item.editionSnapshot,
                    coverImageUrlSnapshot: item.coverImageUrlSnapshot,
                })),
            });
        }

        await prisma.paymentTransaction.deleteMany({ where: { orderId: order.id } });
        await prisma.paymentTransaction.create({
            data: {
                orderId: order.id,
                userId: customer.id,
                gateway: PaymentGateway.STRIPE,
                status: PaymentStatus.SUCCESS,
                amount: subtotal,
                currencyCode: 'USD',
                referenceNumber: `PAY-${seedOrder.orderCode}`,
                requestId: `REQ-${seedOrder.orderCode}`,
            },
        });
    }
}

async function main() {
    const languageIdByCode = await upsertLanguages();
    const roleIdByCode = await upsertRoles();
    const permissionIdByCode = await upsertPermissions();
    await upsertRolePermissions(roleIdByCode, permissionIdByCode);

    const users: SeedUser[] = [
        {
            email: 'admin@admin.com',
            password: 'admin1234',
            firstName: 'System',
            lastName: 'Admin',
            isEmailVerified: true,
            roleCodes: [RoleCode.ADMIN],
        },
        {
            email: 'staff1@example.com',
            password: 'staff1234',
            firstName: 'Nguyen',
            lastName: 'Staff',
            isEmailVerified: true,
            roleCodes: [RoleCode.STAFF],
        },
        {
            email: 'customer1@example.com',
            password: 'customer1234',
            firstName: 'Tran',
            lastName: 'Customer',
            isEmailVerified: true,
            roleCodes: [RoleCode.CUSTOMER],
        },
        {
            email: 'warehouse1@example.com',
            password: 'warehouse1234',
            firstName: 'Le',
            lastName: 'Warehouse',
            isEmailVerified: true,
            roleCodes: [RoleCode.WAREHOUSE],
        },
        {
            email: 'guest1@example.com',
            password: 'guest1234',
            firstName: 'Guest',
            lastName: 'User',
            isEmailVerified: false,
            roleCodes: [RoleCode.GUEST],
        },
    ];

    for (const user of users) {
        const u = await upsertUserWithRoles(user, roleIdByCode);
        console.log(`Seeded user: ${u.email}`);
    }

    try {
        const categoryIdBySlug = await upsertCatalogCategories(languageIdByCode);
        const bookIdBySlug = await upsertCatalogBooks(languageIdByCode, categoryIdBySlug);
        await upsertDemoReviews(bookIdBySlug);
        await upsertDemoOrders(bookIdBySlug, languageIdByCode);
    } catch (error: any) {
        if (error?.code === 'P2021') {
            console.warn('[seed] Skip catalog demo seed: required catalog tables are missing in current database.');
            console.warn('[seed] Run migrations first, e.g. `npx prisma migrate dev` or `npx prisma db push`, then seed again.');
            return;
        }
        throw error;
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
