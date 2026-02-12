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
    costPrice: number;
    price: number;
    currencyCode: string;
    stock: number;
  }>;
};

type SeededUser = {
  id: bigint;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
};

type SeededBook = {
  id: bigint;
  slug: string;
  titleSnapshot: string;
  coverImageUrlSnapshot: string | null;
};

type SeededVariant = {
  id: bigint;
  bookId: bigint;
  format: BookFormat;
  edition: number | null;
  isbn: string | null;
  price: number;
  currencyCode: string | null;
  titleSnapshot: string;
  coverImageUrlSnapshot: string | null;
};

type SeededSnapshot = {
  id: bigint;
  bookId: bigint;
  bookVariantId: bigint;
  priceSnapshot: number;
  formatSnapshot: BookFormat;
  editionSnapshot: number | null;
  titleSnapshot: string;
  coverImageUrlSnapshot: string | null;
};

type SeededPurchase = {
  userId: bigint;
  bookId: bigint;
  bookVariantId: bigint;
};

const CURRENCY_CODE_VND = 'VND';
const CUSTOMER_COUNT = 50;
const BOOK_COUNT = 100;
const VARIANTS_PER_BOOK = 4;
const SNAPSHOTS_PER_VARIANT = 2;
const ORDER_COUNT = 50;
const MIN_REVIEW_PER_BOOK = 50;
const MAX_REVIEW_PER_BOOK = 70;
const ORDER_CODE_PREFIX = 'SEED-ORD-';
const REVIEW_CONTENT_PREFIX = '[seed-review]';

const BOOK_FORMATS: BookFormat[] = [
  BookFormat.HARDCOVER,
  BookFormat.PAPERBACK,
  BookFormat.EBOOK,
  BookFormat.AUDIOBOOK,
];

async function upsertRoles() {
  const roles = [
    { code: RoleCode.ADMIN, name: 'admin', description: 'Full access' },
    { code: RoleCode.STAFF, name: 'staff', description: 'Backoffice staff' },
    { code: RoleCode.CUSTOMER, name: 'customer', description: 'End user' },
    { code: RoleCode.GUEST, name: 'guest', description: 'Guest user' },
    {
      code: RoleCode.WAREHOUSE,
      name: 'warehouse',
      description: 'Inventory staff',
    },
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

  const roleRows = await prisma.role.findMany({
    select: { id: true, code: true },
  });
  return new Map(roleRows.map((x) => [x.code, x.id] as const));
}

async function upsertPermissions() {
  const permissions: SeedPermission[] = [
    {
      code: PermissionCode.HEALTH_READ,
      method: 'GET',
      pathPattern: '/api/v1/health',
      description: 'Read service health',
    },

    {
      code: PermissionCode.ROLE_READ,
      method: 'GET',
      pathPattern: '/api/v1/role',
      description: 'List roles',
    },
    {
      code: PermissionCode.ROLE_READ_ONE,
      method: 'GET',
      pathPattern: '/api/v1/role/:name',
      description: 'Get role by name',
    },

    {
      code: PermissionCode.PERMISSION_READ,
      method: 'GET',
      pathPattern: '/api/v1/permission',
      description: 'List permissions',
    },
    {
      code: PermissionCode.PERMISSION_CREATE,
      method: 'POST',
      pathPattern: '/api/v1/permission',
      description: 'Create permission',
    },
    {
      code: PermissionCode.PERMISSION_UPDATE,
      method: 'PATCH',
      pathPattern: '/api/v1/permission/:id',
      description: 'Update permission',
    },
    {
      code: PermissionCode.PERMISSION_DELETE,
      method: 'DELETE',
      pathPattern: '/api/v1/permission/:id',
      description: 'Delete permission',
    },

    {
      code: PermissionCode.ROLE_PERMISSION_GRANT,
      method: 'POST',
      pathPattern: '/api/v1/role-permission',
      description: 'Grant permission to role',
    },
    {
      code: PermissionCode.ROLE_PERMISSION_READ_BY_ROLE,
      method: 'GET',
      pathPattern: '/api/v1/role-permission/role/:roleId',
      description: 'List permissions of a role',
    },
    {
      code: PermissionCode.ROLE_PERMISSION_READ_BY_PERMISSION,
      method: 'GET',
      pathPattern: '/api/v1/role-permission/permission/:permissionId',
      description: 'List roles that have a permission',
    },

    {
      code: PermissionCode.DEVICE_READ,
      method: 'GET',
      pathPattern: '/api/v1/device',
      description: 'List devices',
    },
    {
      code: PermissionCode.LOGIN_ATTEMPT_READ_BY_USER,
      method: 'GET',
      pathPattern: '/api/v1/login-attempt/user/:userId',
      description: 'List login attempts by user id',
    },
    {
      code: PermissionCode.EMAIL_OUTBOX_GET,
      method: 'GET',
      pathPattern: '/api/v1/email-outbox',
      description: 'List OTP email outbox by filter',
    },

    {
      code: PermissionCode.AUTH_REGISTER,
      method: 'POST',
      pathPattern: '/api/v1/auth/register',
      description: 'Register user',
    },
    {
      code: PermissionCode.AUTH_LOGIN,
      method: 'POST',
      pathPattern: '/api/v1/auth/login',
      description: 'Login',
    },
    {
      code: PermissionCode.AUTH_ME_READ,
      method: 'GET',
      pathPattern: '/api/v1/auth/me',
      description: 'Get current user profile',
    },
    {
      code: PermissionCode.AUTH_TOKEN_REFRESH,
      method: 'POST',
      pathPattern: '/api/v1/auth/refresh-token',
      description: 'Refresh access token',
    },
    {
      code: PermissionCode.AUTH_LOGOUT,
      method: 'POST',
      pathPattern: '/api/v1/auth/logout',
      description: 'Logout',
    },
    {
      code: PermissionCode.AUTH_PASSWORD_FORGOT,
      method: 'POST',
      pathPattern: '/api/v1/auth/forgot-password',
      description: 'Request password reset',
    },
    {
      code: PermissionCode.AUTH_EMAIL_VERIFY,
      method: 'GET',
      pathPattern: '/api/v1/auth/verify-email',
      description: 'Verify email',
    },
    {
      code: PermissionCode.AUTH_EMAIL_RESEND,
      method: 'POST',
      pathPattern: '/api/v1/auth/resend-email',
      description: 'Resend verification email',
    },
    {
      code: PermissionCode.AUTH_PASSWORD_CHANGE,
      method: 'POST',
      pathPattern: '/api/v1/auth/change-password',
      description: 'Change password',
    },
    {
      code: PermissionCode.AUTH_PASSWORD_RESET_VALIDATE,
      method: 'POST',
      pathPattern: '/api/v1/auth/reset-password/validate',
      description: 'Validate reset password token',
    },
    {
      code: PermissionCode.AUTH_PASSWORD_RESET,
      method: 'POST',
      pathPattern: '/api/v1/auth/reset-password',
      description: 'Reset password',
    },
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

  const permissionRows = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  return new Map(
    permissionRows.map((x) => [x.code as PermissionCode, x.id] as const),
  );
}

async function upsertUserWithRoles(
  user: SeedUser,
  roleIdByCode: Map<RoleCode, bigint>,
) {
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
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
    },
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

  const rows = await prisma.language.findMany({
    select: { id: true, code: true },
  });
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
    [RoleCode.WAREHOUSE]: [
      PermissionCode.HEALTH_READ,
      PermissionCode.DEVICE_READ,
    ],
    [RoleCode.CUSTOMER]: [
      PermissionCode.HEALTH_READ,
      PermissionCode.DEVICE_READ,
    ],
    [RoleCode.GUEST]: [PermissionCode.HEALTH_READ],
  };

  for (const [roleCode, permissionCodes] of Object.entries(
    rolePermissionMap,
  ) as [RoleCode, PermissionCode[]][]) {
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
    {
      slug: 'programming',
      sortOrder: 1,
      viName: 'Lập trình',
      enName: 'Programming',
    },
    {
      slug: 'architecture',
      sortOrder: 2,
      viName: 'Kiến trúc phần mềm',
      enName: 'Architecture',
    },
    { slug: 'devops', sortOrder: 3, viName: 'DevOps', enName: 'DevOps' },
    {
      slug: 'backend',
      sortOrder: 4,
      viName: 'Backend',
      enName: 'Backend',
      parentSlug: 'programming',
    },
    {
      slug: 'frontend',
      sortOrder: 5,
      viName: 'Frontend',
      enName: 'Frontend',
      parentSlug: 'programming',
    },
  ];

  const viLanguageId = languageIdByCode.get('vi');
  const enLanguageId = languageIdByCode.get('en');
  if (!viLanguageId || !enLanguageId) {
    throw new Error('Missing vi/en language seed');
  }

  const categoryIdBySlug = new Map<string, bigint>();

  for (const category of categories) {
    const parentId = category.parentSlug
      ? categoryIdBySlug.get(category.parentSlug)
      : null;

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

const BOOK_SUBJECTS = [
  'Lap trinh backend',
  'Kien truc phan mem',
  'He thong phan tan',
  'TypeScript thuc chien',
  'Toi uu hieu nang',
  'Microservices thuc te',
  'DevOps can ban',
  'Quan ly du an cong nghe',
  'Bao mat ung dung',
  'Thiet ke API',
];

const PUBLISHER_NAMES = [
  'Nha Xuat Ban Tre',
  'Nha Xuat Ban Tong Hop',
  'Nha Xuat Ban Lao Dong',
  'Nha Xuat Ban Tri Thuc',
  'Nha Xuat Ban Van Hoa',
];

const FIRST_NAMES = [
  'Nguyen',
  'Tran',
  'Le',
  'Pham',
  'Hoang',
  'Vu',
  'Do',
  'Dang',
  'Bui',
  'Phan',
];

const LAST_NAMES = [
  'An',
  'Binh',
  'Chi',
  'Dung',
  'Giang',
  'Hanh',
  'Khanh',
  'Linh',
  'Minh',
  'Nam',
  'Phuong',
  'Quang',
  'Thao',
  'Trang',
  'Vy',
];

const REVIEW_CONTENT_BY_RATING: Record<number, string[]> = {
  1: [
    'Noi dung khong dung nhu ky vong.',
    'Sach kho theo doi va bi lan man.',
    'Vi du khong thuc te, kho ap dung.',
  ],
  2: [
    'Y tuong duoc nhung trinh bay con roi.',
    'Tam on nhung chua xung dang gia tien.',
    'Co mot so chuong hay nhung tong the trung binh.',
  ],
  3: [
    'Sach o muc on, co the tham khao.',
    'Noi dung kha day du, can them vi du moi.',
    'Doc duoc, phu hop nguoi moi bat dau.',
  ],
  4: [
    'Noi dung ro rang, de ung dung trong cong viec.',
    'Kien thuc thuc te, bo cuc hop ly.',
    'Cuon sach tot, dang de tham khao lau dai.',
  ],
  5: [
    'Rat chat luong, doc xong ap dung duoc ngay.',
    'Mot trong nhung cuon hay nhat ve chu de nay.',
    'Noi dung sau va co gia tri su dung cao.',
  ],
};

const ADDRESS_POOL = [
  { city: 'Ho Chi Minh', district: 'Quan 1', ward: 'Ben Nghe' },
  { city: 'Ho Chi Minh', district: 'Quan 7', ward: 'Tan Phong' },
  { city: 'Ha Noi', district: 'Cau Giay', ward: 'Dich Vong' },
  { city: 'Ha Noi', district: 'Thanh Xuan', ward: 'Khuong Trung' },
  { city: 'Da Nang', district: 'Hai Chau', ward: 'Hoa Cuong' },
  { city: 'Can Tho', district: 'Ninh Kieu', ward: 'An Hoa' },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomOne<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function takeRandomUnique<T>(items: T[], take: number) {
  return shuffle(items).slice(0, Math.max(0, Math.min(take, items.length)));
}

function pullRandomUnique<T>(items: T[], take: number) {
  const picked: T[] = [];
  const count = Math.max(0, Math.min(take, items.length));
  for (let i = 0; i < count; i += 1) {
    const index = randomInt(0, items.length - 1);
    const [item] = items.splice(index, 1);
    if (item) picked.push(item);
  }
  return picked;
}

function toRoundedVnd(value: number) {
  return Math.max(1000, Math.round(value / 1000) * 1000);
}

function randomDateWithinDays(days: number) {
  const now = Date.now();
  const offsetDays = randomInt(0, days);
  const offsetMinutes = randomInt(0, 24 * 60 - 1);
  return new Date(
    now - offsetDays * 24 * 60 * 60 * 1000 - offsetMinutes * 60 * 1000,
  );
}

function weightedReviewRating() {
  const roll = Math.random() * 100;
  if (roll < 8) return 1;
  if (roll < 22) return 2;
  if (roll < 55) return 3;
  if (roll < 84) return 4;
  return 5;
}

function randomDiscountRate() {
  return randomOne([0, 0, 0.05, 0.1, 0.1, 0.15, 0.2]);
}

function resolveOrderState() {
  const roll = Math.random() * 100;
  if (roll < 8) {
    return {
      status: OrderStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
    };
  }
  if (roll < 14) {
    return {
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.FAILED,
    };
  }
  if (roll < 24) {
    return { status: OrderStatus.PAID, paymentStatus: PaymentStatus.SUCCESS };
  }
  if (roll < 36) {
    return {
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.SUCCESS,
    };
  }
  if (roll < 52) {
    return {
      status: OrderStatus.PACKING,
      paymentStatus: PaymentStatus.SUCCESS,
    };
  }
  if (roll < 70) {
    return {
      status: OrderStatus.SHIPPING,
      paymentStatus: PaymentStatus.SUCCESS,
    };
  }
  return {
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.SUCCESS,
  };
}

function buildCustomerSeedUsers() {
  const users: SeedUser[] = [];
  for (let i = 1; i <= CUSTOMER_COUNT; i += 1) {
    users.push({
      email: `customer${i}@example.com`,
      password: 'customer1234',
      firstName: FIRST_NAMES[i % FIRST_NAMES.length],
      lastName: LAST_NAMES[(i * 3) % LAST_NAMES.length],
      phoneNumber: `09${(10000000 + i).toString().padStart(8, '0')}`,
      isEmailVerified: true,
      roleCodes: [RoleCode.CUSTOMER],
    });
  }
  return users;
}

function buildSeedBooks(categorySlugs: string[]): SeedBook[] {
  const books: SeedBook[] = [];

  const basePriceByFormat: Record<BookFormat, number> = {
    [BookFormat.HARDCOVER]: 260_000,
    [BookFormat.PAPERBACK]: 180_000,
    [BookFormat.EBOOK]: 120_000,
    [BookFormat.AUDIOBOOK]: 140_000,
  };

  for (let i = 1; i <= BOOK_COUNT; i += 1) {
    const code = i.toString().padStart(3, '0');
    const subject = BOOK_SUBJECTS[(i - 1) % BOOK_SUBJECTS.length];
    const categoryCount = randomInt(1, 2);
    const categories = takeRandomUnique(categorySlugs, categoryCount);

    const variants = BOOK_FORMATS.slice(0, VARIANTS_PER_BOOK).map(
      (format, formatIndex) => {
        const base = basePriceByFormat[format];
        const price = toRoundedVnd(
          base * (0.9 + Math.random() * 0.45) + i * 170,
        );
        const costPrice = toRoundedVnd(price * (0.55 + Math.random() * 0.18));
        const stock =
          format === BookFormat.EBOOK || format === BookFormat.AUDIOBOOK
            ? randomInt(200, 1200)
            : randomInt(25, 240);
        const isbn = `978604${code}${(formatIndex + 1).toString()}${((i + formatIndex) % 10).toString()}${((i * 3 + formatIndex) % 10).toString()}`;

        return {
          format,
          edition: 1,
          isbn,
          costPrice,
          price,
          currencyCode: CURRENCY_CODE_VND,
          stock,
        };
      },
    );

    books.push({
      slug: `seed-book-${code}`,
      viTitle: `${subject} ${code}`,
      enTitle: `${subject} ${code}`,
      viDescription: `Sach chu de ${subject.toLowerCase()} voi vi du thuc te va bai hoc ap dung.`,
      enDescription: `Practical handbook about ${subject.toLowerCase()} with real-world examples.`,
      coverImageUrl: `https://picsum.photos/seed/book-${code}/640/960`,
      publicationYear: randomInt(2008, 2025),
      pageCount: randomInt(180, 760),
      weightGrams: randomInt(260, 1200),
      publisherName: randomOne(PUBLISHER_NAMES),
      categories,
      variants,
    });
  }

  return books;
}

async function upsertCatalogBooks(
  languageIdByCode: Map<string, number>,
  categoryIdBySlug: Map<string, bigint>,
): Promise<{ books: SeededBook[]; variants: SeededVariant[] }> {
  const viLanguageId = languageIdByCode.get('vi');
  const enLanguageId = languageIdByCode.get('en');
  if (!viLanguageId || !enLanguageId) {
    throw new Error('Missing vi/en language seed');
  }

  const books = buildSeedBooks([...categoryIdBySlug.keys()]);
  const seededBooks: SeededBook[] = [];
  const seededVariants: SeededVariant[] = [];

  for (const book of books) {
    const publisherId = await upsertPublisherByName(book.publisherName);

    const existingTranslation = await prisma.bookTranslation.findFirst({
      where: { languageId: viLanguageId, slug: book.slug },
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
      where: { bookId_languageId: { bookId, languageId: viLanguageId } },
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
      where: { bookId_languageId: { bookId, languageId: enLanguageId } },
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
        return { bookId, categoryId };
      }),
      skipDuplicates: true,
    });

    seededBooks.push({
      id: bookId,
      slug: book.slug,
      titleSnapshot: book.viTitle,
      coverImageUrlSnapshot: book.coverImageUrl,
    });

    for (const variant of book.variants) {
      const edition = variant.edition ?? 1;
      const variantRow = await prisma.bookVariant.upsert({
        where: {
          bookId_format_edition: {
            bookId,
            format: variant.format,
            edition,
          },
        },
        update: {
          isbn: variant.isbn,
          costPrice: variant.costPrice,
          price: variant.price,
          currencyCode: variant.currencyCode,
          stock: variant.stock,
          isActive: true,
        },
        create: {
          bookId,
          format: variant.format,
          edition,
          isbn: variant.isbn,
          costPrice: variant.costPrice,
          price: variant.price,
          currencyCode: variant.currencyCode,
          stock: variant.stock,
          isActive: true,
        },
        select: {
          id: true,
          bookId: true,
          format: true,
          edition: true,
          isbn: true,
          price: true,
          currencyCode: true,
        },
      });

      seededVariants.push({
        id: variantRow.id,
        bookId: variantRow.bookId,
        format: variantRow.format,
        edition: variantRow.edition,
        isbn: variantRow.isbn,
        price: Number(variantRow.price),
        currencyCode: variantRow.currencyCode,
        titleSnapshot: book.viTitle,
        coverImageUrlSnapshot: book.coverImageUrl,
      });
    }
  }

  return { books: seededBooks, variants: seededVariants };
}

async function upsertVariantSnapshots(variants: SeededVariant[]) {
  const snapshots: SeededSnapshot[] = [];

  for (const variant of variants) {
    const keepIds: bigint[] = [];
    const targetPrices = [
      toRoundedVnd(variant.price),
      toRoundedVnd(variant.price * (0.88 + Math.random() * 0.2)),
    ];

    for (let idx = 0; idx < SNAPSHOTS_PER_VARIANT; idx += 1) {
      const skuSnapshot = `SEED-SKU-${variant.id.toString()}-${idx + 1}`;
      const payload = {
        bookVariantId: variant.id,
        skuSnapshot,
        priceSnapshot: targetPrices[idx],
        currencyCodeSnapshot: CURRENCY_CODE_VND,
        formatSnapshot: variant.format,
        editionSnapshot: variant.edition,
        isbnSnapshot: variant.isbn,
      };

      const existing = await prisma.bookVariantSnapshot.findFirst({
        where: { bookVariantId: variant.id, skuSnapshot },
        select: { id: true },
      });

      const row = existing
        ? await prisma.bookVariantSnapshot.update({
            where: { id: existing.id },
            data: payload,
            select: {
              id: true,
              bookVariantId: true,
              priceSnapshot: true,
              formatSnapshot: true,
              editionSnapshot: true,
            },
          })
        : await prisma.bookVariantSnapshot.create({
            data: payload,
            select: {
              id: true,
              bookVariantId: true,
              priceSnapshot: true,
              formatSnapshot: true,
              editionSnapshot: true,
            },
          });

      keepIds.push(row.id);
      snapshots.push({
        id: row.id,
        bookId: variant.bookId,
        bookVariantId: row.bookVariantId!,
        priceSnapshot: Number(row.priceSnapshot),
        formatSnapshot: row.formatSnapshot,
        editionSnapshot: row.editionSnapshot,
        titleSnapshot: variant.titleSnapshot,
        coverImageUrlSnapshot: variant.coverImageUrlSnapshot,
      });
    }

    const staleRows = await prisma.bookVariantSnapshot.findMany({
      where: {
        bookVariantId: variant.id,
        skuSnapshot: { startsWith: `SEED-SKU-${variant.id.toString()}-` },
        id: { notIn: keepIds },
      },
      select: { id: true },
    });

    if (!staleRows.length) continue;

    const staleIds = staleRows.map((row) => row.id);
    const usedRows = await prisma.orderItem.findMany({
      where: { bookVariantSnapshotId: { in: staleIds } },
      select: { bookVariantSnapshotId: true },
    });

    const usedIdSet = new Set(
      usedRows
        .map((row) => row.bookVariantSnapshotId?.toString())
        .filter((id): id is string => Boolean(id)),
    );

    const deletableIds = staleIds.filter((id) => !usedIdSet.has(id.toString()));
    if (deletableIds.length) {
      await prisma.bookVariantSnapshot.deleteMany({
        where: { id: { in: deletableIds } },
      });
    }
  }

  return snapshots;
}

async function upsertDemoReviews(
  books: SeededBook[],
  variants: SeededVariant[],
  customers: SeededUser[],
  purchases: SeededPurchase[],
) {
  if (!books.length || !customers.length) return;
  const variantIdsByBookId = new Map<string, bigint[]>();
  const purchasesByBookId = new Map<string, SeededPurchase[]>();

  for (const variant of variants) {
    const key = variant.bookId.toString();
    if (!variantIdsByBookId.has(key)) {
      variantIdsByBookId.set(key, []);
    }
    variantIdsByBookId.get(key)!.push(variant.id);
  }

  for (const purchase of purchases) {
    const key = purchase.bookId.toString();
    if (!purchasesByBookId.has(key)) {
      purchasesByBookId.set(key, []);
    }
    purchasesByBookId.get(key)!.push(purchase);
  }

  for (const book of books) {
    const variantIds = variantIdsByBookId.get(book.id.toString()) ?? [];
    if (!variantIds.length) {
      continue;
    }

    const purchasePool = purchasesByBookId.get(book.id.toString()) ?? [];

    await prisma.review.deleteMany({
      where: {
        bookId: book.id,
        content: { startsWith: REVIEW_CONTENT_PREFIX },
      },
    });

    const reviewCount = randomInt(MIN_REVIEW_PER_BOOK, MAX_REVIEW_PER_BOOK);
    const uniqueCustomers = shuffle(customers).slice(
      0,
      Math.min(customers.length, reviewCount),
    );
    const data: Array<{
      userId: bigint;
      bookId: bigint;
      bookVariantId: bigint;
      rating: number;
      content: string;
      createdAt: Date;
    }> = [];

    for (let i = 0; i < reviewCount; i += 1) {
      const fallbackCustomer =
        i < uniqueCustomers.length ? uniqueCustomers[i] : randomOne(customers);
      const purchase = purchasePool.length ? randomOne(purchasePool) : null;
      const rating = weightedReviewRating();
      const content = `${REVIEW_CONTENT_PREFIX} ${randomOne(REVIEW_CONTENT_BY_RATING[rating])}`;
      data.push({
        userId: purchase?.userId ?? fallbackCustomer.id,
        bookId: book.id,
        bookVariantId: purchase?.bookVariantId ?? randomOne(variantIds),
        rating,
        content,
        createdAt: randomDateWithinDays(365),
      });
    }

    await prisma.review.createMany({ data });
  }
}

async function upsertDemoOrders(
  customers: SeededUser[],
  snapshots: SeededSnapshot[],
): Promise<SeededPurchase[]> {
  if (!customers.length || !snapshots.length) return [];

  const purchases: SeededPurchase[] = [];

  await prisma.order.deleteMany({
    where: {
      orderCode: {
        startsWith: ORDER_CODE_PREFIX,
      },
    },
  });

  const snapshotsByBookId = new Map<string, SeededSnapshot[]>();
  for (const snapshot of snapshots) {
    const key = snapshot.bookId.toString();
    if (!snapshotsByBookId.has(key)) {
      snapshotsByBookId.set(key, []);
    }
    snapshotsByBookId.get(key)!.push(snapshot);
  }

  const mandatorySnapshots = shuffle(
    [...snapshotsByBookId.values()].map((bookSnapshots) =>
      randomOne(bookSnapshots),
    ),
  );

  const preAssignedByOrder = Array.from(
    { length: ORDER_COUNT },
    () => [] as SeededSnapshot[],
  );
  mandatorySnapshots.forEach((snapshot, index) => {
    preAssignedByOrder[index % ORDER_COUNT].push(snapshot);
  });

  const mandatorySnapshotIdSet = new Set(
    mandatorySnapshots.map((snapshot) => snapshot.id.toString()),
  );
  const availableSnapshots = shuffle(
    snapshots.filter(
      (snapshot) => !mandatorySnapshotIdSet.has(snapshot.id.toString()),
    ),
  );

  for (let index = 1; index <= ORDER_COUNT; index += 1) {
    const customer = randomOne(customers);
    const seededSnapshots = [...preAssignedByOrder[index - 1]];
    const maxExtra = Math.max(0, 4 - seededSnapshots.length);
    const extraCount = maxExtra > 0 ? randomInt(0, maxExtra) : 0;
    const extraSnapshots = pullRandomUnique(availableSnapshots, extraCount);
    const orderSnapshots = [...seededSnapshots, ...extraSnapshots];
    if (!orderSnapshots.length) continue;

    const state = resolveOrderState();

    const items = orderSnapshots.map((snapshot) => {
      const quantity = randomInt(1, 3);
      const baseUnitPrice = snapshot.priceSnapshot;
      const discountRate = randomDiscountRate();
      const unitPrice = toRoundedVnd(baseUnitPrice * (1 - discountRate));
      const lineTotal = unitPrice * quantity;
      const listLineTotal = toRoundedVnd(baseUnitPrice * quantity);

      return {
        bookId: snapshot.bookId,
        bookVariantId: snapshot.bookVariantId,
        bookVariantSnapshotId: snapshot.id,
        quantity,
        unitPrice,
        lineTotal,
        listLineTotal,
        titleSnapshot: snapshot.titleSnapshot,
        formatSnapshot: snapshot.formatSnapshot,
        editionSnapshot: snapshot.editionSnapshot,
        coverImageUrlSnapshot: snapshot.coverImageUrlSnapshot,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.listLineTotal, 0);
    const discountedSubtotal = items.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    const discountAmount = Math.max(0, subtotal - discountedSubtotal);
    const hasPhysical = items.some(
      (item) =>
        item.formatSnapshot === BookFormat.HARDCOVER ||
        item.formatSnapshot === BookFormat.PAPERBACK,
    );
    const shippingFee = hasPhysical
      ? randomOne([0, 15000, 20000, 25000, 30000])
      : 0;
    const totalAmount = discountedSubtotal + shippingFee;
    const orderCode = `${ORDER_CODE_PREFIX}${index.toString().padStart(4, '0')}`;
    const placedAt = randomDateWithinDays(120);

    const order = await prisma.order.create({
      data: {
        orderCode,
        userId: customer.id,
        status: state.status,
        paymentStatus: state.paymentStatus,
        subtotal,
        discountAmount,
        shippingFee,
        totalAmount,
        currencyCode: CURRENCY_CODE_VND,
        idempotencyKey: `seed-order-${index}`,
        placedAt,
      },
      select: { id: true },
    });

    const location = randomOne(ADDRESS_POOL);
    await prisma.orderAddress.create({
      data: {
        orderId: order.id,
        recipientName:
          `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() ||
          'Seed Customer',
        phoneNumber: customer.phoneNumber ?? '0900000000',
        addressLine: `So ${randomInt(1, 300)} Duong Seed`,
        ward: location.ward,
        district: location.district,
        city: location.city,
        countryCode: 'VN',
        note: 'Seed order address',
      },
    });

    await prisma.orderItem.createMany({
      data: items.map((item) => ({
        orderId: order.id,
        bookVariantSnapshotId: item.bookVariantSnapshotId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        titleSnapshot: item.titleSnapshot,
        formatSnapshot: item.formatSnapshot,
        editionSnapshot: item.editionSnapshot,
        coverImageUrlSnapshot: item.coverImageUrlSnapshot,
      })),
    });

    for (const item of items) {
      purchases.push({
        userId: customer.id,
        bookId: item.bookId,
        bookVariantId: item.bookVariantId,
      });
    }

    const gateway = randomOne([
      PaymentGateway.COD,
      PaymentGateway.VNPAY,
      PaymentGateway.MOMO,
    ]);
    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        userId: customer.id,
        gateway,
        status: state.paymentStatus,
        amount: totalAmount,
        currencyCode: CURRENCY_CODE_VND,
        referenceNumber: `SEED-TXN-${index.toString().padStart(4, '0')}`,
        requestId: `SEED-REQ-${index.toString().padStart(4, '0')}`,
        idempotencyKey: `seed-payment-${index}`,
      },
    });
  }

  return purchases;
}

async function main() {
  const languageIdByCode = await upsertLanguages();
  const roleIdByCode = await upsertRoles();
  const permissionIdByCode = await upsertPermissions();
  await upsertRolePermissions(roleIdByCode, permissionIdByCode);

  const fixedUsers: SeedUser[] = [
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

  for (const user of fixedUsers) {
    const u = await upsertUserWithRoles(user, roleIdByCode);
    console.log(`Seeded user: ${u.email}`);
  }

  const customerUsers = buildCustomerSeedUsers();
  const seededCustomers: SeededUser[] = [];
  for (const user of customerUsers) {
    const seeded = await upsertUserWithRoles(user, roleIdByCode);
    seededCustomers.push(seeded);
  }

  console.log(`Seeded customers: ${seededCustomers.length}`);

  try {
    const categoryIdBySlug = await upsertCatalogCategories(languageIdByCode);
    const { books, variants } = await upsertCatalogBooks(
      languageIdByCode,
      categoryIdBySlug,
    );
    const snapshots = await upsertVariantSnapshots(variants);

    const purchases = await upsertDemoOrders(seededCustomers, snapshots);
    await upsertDemoReviews(books, variants, seededCustomers, purchases);

    console.log(`Seeded books: ${books.length}`);
    console.log(`Seeded variants: ${variants.length}`);
    console.log(`Seeded snapshots: ${snapshots.length}`);
    console.log(`Seeded orders: ${ORDER_COUNT}`);
  } catch (error: any) {
    if (error?.code === 'P2021') {
      console.warn(
        '[seed] Skip catalog demo seed: required catalog tables are missing in current database.',
      );
      console.warn(
        '[seed] Run migrations first, e.g. `npx prisma migrate dev` or `npx prisma db push`, then seed again.',
      );
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
