// prisma/seed.ts
import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
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
const CUSTOMER_COUNT = 20;
const BOOK_COUNT = 25;
const SNAPSHOTS_PER_VARIANT = 1;
const ORDER_COUNT = 0;
const MIN_REVIEW_PER_BOOK = 10;
const MAX_REVIEW_PER_BOOK = 10;
const ORDER_CODE_PREFIX = 'SEED-ORD-';
const REVIEW_CONTENT_PREFIX = '[seed-review]';

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
      code: PermissionCode.GUEST_SESSION_GET_ALL,
      method: 'GET',
      pathPattern: '/api/v1/guest-session',
      description: 'List guest sessions',
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
      code: PermissionCode.SEARCH_REINDEX_BOOKS,
      method: 'POST',
      pathPattern: '/api/v1/search/reindex',
      description: 'Reindex search vectors in Pinecone',
    },
    {
      code: PermissionCode.AUTHOR_CREATE,
      method: 'POST',
      pathPattern: '/api/v1/authors',
      description: 'Create author',
    },
    {
      code: PermissionCode.PUBLISHER_CREATE,
      method: 'POST',
      pathPattern: '/api/v1/publishers',
      description: 'Create publisher',
    },
    {
      code: PermissionCode.CATEGORY_CREATE,
      method: 'POST',
      pathPattern: '/api/v1/categories',
      description: 'Create category',
    },
    {
      code: PermissionCode.ADMIN_CREATE_BOOK,
      method: 'POST',
      pathPattern: '/api/v1/admin/books',
      description: 'Create admin book',
    },
    {
      code: PermissionCode.ADMIN_CREATE_BOOK_ALL,
      method: 'POST',
      pathPattern: '/api/v1/admin/books/all',
      description: 'Create admin book with full payload',
    },
    {
      code: PermissionCode.ADMIN_UPDATE_BOOK,
      method: 'PATCH',
      pathPattern: '/api/v1/admin/books/:bookId',
      description: 'Update admin book',
    },
    {
      code: PermissionCode.ADMIN_DELETE_BOOK,
      method: 'DELETE',
      pathPattern: '/api/v1/admin/books/:bookId',
      description: 'Soft delete admin book',
    },
    {
      code: PermissionCode.ADMIN_READ,
      method: 'GET',
      pathPattern: '/api/v1/admin/*',
      description: 'Read admin resources',
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

type DetailedCategorySeed = SeedCategory & {
  viDescription: string;
  enDescription: string;
};

async function upsertCatalogCategories(languageIdByCode: Map<string, number>) {
  const categories: DetailedCategorySeed[] = [
    {
      slug: 'technology',
      sortOrder: 1,
      viName: 'Cong nghe',
      enName: 'Technology',
      viDescription:
        'Nhom sach ve cong nghe hien dai, gom lap trinh, van hanh he thong, bao mat va du lieu.',
      enDescription:
        'Technology books covering programming, infrastructure, security, and modern data systems.',
    },
    {
      slug: 'programming',
      sortOrder: 2,
      parentSlug: 'technology',
      viName: 'Lap trinh',
      enName: 'Programming',
      viDescription:
        'Sach tap trung ky thuat coding thuc chien, clean code, testing va toi uu chat luong phan mem.',
      enDescription:
        'Hands-on coding books focused on clean code, testing, and practical engineering quality.',
    },
    {
      slug: 'software-architecture',
      sortOrder: 3,
      parentSlug: 'technology',
      viName: 'Kien truc phan mem',
      enName: 'Software Architecture',
      viDescription:
        'Noi dung ve kien truc he thong, phan ra domain, mo rong va van hanh on dinh tren quy mo lon.',
      enDescription:
        'Software architecture, domain boundaries, scalability, and resilient system design at scale.',
    },
    {
      slug: 'devops-cloud',
      sortOrder: 4,
      parentSlug: 'technology',
      viName: 'DevOps va Cloud',
      enName: 'DevOps & Cloud',
      viDescription:
        'Sach ve CI/CD, container, cloud native va quan tri ha tang theo huong tu dong hoa.',
      enDescription:
        'DevOps and cloud-native books on CI/CD, containers, automation, and infrastructure operations.',
    },
    {
      slug: 'cybersecurity',
      sortOrder: 5,
      parentSlug: 'technology',
      viName: 'An toan thong tin',
      enName: 'Cybersecurity',
      viDescription:
        'Kien thuc ve phong thu ung dung, quan ly rui ro va trien khai bao mat trong vong doi san pham.',
      enDescription:
        'Cybersecurity practices for secure-by-design software, threat modeling, and risk management.',
    },
    {
      slug: 'data-ai',
      sortOrder: 6,
      parentSlug: 'technology',
      viName: 'Du lieu va AI',
      enName: 'Data & AI',
      viDescription:
        'Sach ve data engineering, phan tich du lieu va ung dung machine learning cho bai toan thuc te.',
      enDescription:
        'Data engineering, analytics, and applied AI books for production-ready decision systems.',
    },
    {
      slug: 'business-economics',
      sortOrder: 7,
      viName: 'Kinh doanh va kinh te',
      enName: 'Business & Economics',
      viDescription:
        'Nhom sach ve tang truong doanh nghiep, van hanh, chien luoc san pham va mo hinh tai chinh.',
      enDescription:
        'Business and economics titles about growth, operations, product strategy, and financial models.',
    },
    {
      slug: 'entrepreneurship',
      sortOrder: 8,
      parentSlug: 'business-economics',
      viName: 'Khoi nghiep',
      enName: 'Entrepreneurship',
      viDescription:
        'Sach cho nha sang lap: xac thuc y tuong, tim product-market fit va xay dung doi ngu ban dau.',
      enDescription:
        'Entrepreneurship books on validation, product-market fit, and early team execution.',
    },
    {
      slug: 'management-leadership',
      sortOrder: 9,
      parentSlug: 'business-economics',
      viName: 'Quan tri va lanh dao',
      enName: 'Management & Leadership',
      viDescription:
        'Noi dung ve van hanh doi ngu, danh gia hieu suat, lap ke hoach va ra quyet dinh lanh dao.',
      enDescription:
        'Management and leadership books on team operations, planning, feedback, and decision quality.',
    },
    {
      slug: 'marketing-sales',
      sortOrder: 10,
      parentSlug: 'business-economics',
      viName: 'Marketing va ban hang',
      enName: 'Marketing & Sales',
      viDescription:
        'Sach huong dan xay dung thong diep, kenh tiep can va he thong chuyen doi doanh thu on dinh.',
      enDescription:
        'Books on positioning, channel strategy, and conversion-focused marketing and sales execution.',
    },
    {
      slug: 'finance-investing',
      sortOrder: 11,
      parentSlug: 'business-economics',
      viName: 'Tai chinh va dau tu',
      enName: 'Finance & Investing',
      viDescription:
        'Sach tai chinh ca nhan, phan tich bao cao tai chinh va cac nguyen tac dau tu ben vung.',
      enDescription:
        'Finance books covering personal money systems, statement analysis, and long-term investing.',
    },
    {
      slug: 'mind-society',
      sortOrder: 12,
      viName: 'Tam tri va xa hoi',
      enName: 'Mind & Society',
      viDescription:
        'Nhom sach khai pha hanh vi con nguoi, boi canh xa hoi va tu duy de hieu sau cac quyet dinh.',
      enDescription:
        'Mind and society books exploring behavior, culture, institutions, and decision dynamics.',
    },
    {
      slug: 'psychology',
      sortOrder: 13,
      parentSlug: 'mind-society',
      viName: 'Tam ly hoc',
      enName: 'Psychology',
      viDescription:
        'Sach tam ly ung dung cho hoc tap, cong viec va quan ly ban than theo huong thuc hanh.',
      enDescription:
        'Practical psychology books for habits, motivation, communication, and personal effectiveness.',
    },
    {
      slug: 'history',
      sortOrder: 14,
      parentSlug: 'mind-society',
      viName: 'Lich su',
      enName: 'History',
      viDescription:
        'Sach lich su theo huong tong hop boi canh, nhan qua va bai hoc cho hien tai.',
      enDescription:
        'History titles connecting context, causality, and practical lessons for current society.',
    },
    {
      slug: 'philosophy',
      sortOrder: 15,
      parentSlug: 'mind-society',
      viName: 'Triet hoc',
      enName: 'Philosophy',
      viDescription:
        'Sach triet hoc ung dung giup lam ro he gia tri, nang cao nang luc lap luan va phan bien.',
      enDescription:
        'Applied philosophy books for reasoning, ethics, values, and structured critical thinking.',
    },
    {
      slug: 'social-issues',
      sortOrder: 16,
      parentSlug: 'mind-society',
      viName: 'Van de xa hoi',
      enName: 'Social Issues',
      viDescription:
        'Sach phan tich nhung thach thuc xa hoi duong dai nhu cong dan so, dao duc du lieu va AI.',
      enDescription:
        'Books on modern social issues such as digital citizenship, data ethics, and AI governance.',
    },
    {
      slug: 'literature-arts',
      sortOrder: 17,
      viName: 'Van hoc va nghe thuat',
      enName: 'Literature & Arts',
      viDescription:
        'Nhom sach van hoc voi gia tri cam xuc, ngon ngu va nghe thuat ke chuyen.',
      enDescription:
        'Literature and arts books centered on narrative craft, language, and emotional depth.',
    },
    {
      slug: 'fiction',
      sortOrder: 18,
      parentSlug: 'literature-arts',
      viName: 'Tieu thuyet',
      enName: 'Fiction',
      viDescription:
        'Tieu thuyet dang dai va duong dai, khac hoa nhan vat ro net va xung dot day suc nang.',
      enDescription:
        'Fiction titles with strong character arcs, layered conflicts, and memorable narrative voice.',
    },
    {
      slug: 'short-stories',
      sortOrder: 19,
      parentSlug: 'literature-arts',
      viName: 'Truyen ngan',
      enName: 'Short Stories',
      viDescription:
        'Tuyen tap truyen ngan tinh gon, giau hinh anh va mot ket thuc co du am.',
      enDescription:
        'Short story collections with concise structure, vivid imagery, and resonant endings.',
    },
    {
      slug: 'children-ya',
      sortOrder: 20,
      parentSlug: 'literature-arts',
      viName: 'Thieu nhi va tuoi moi lon',
      enName: 'Children & YA',
      viDescription:
        'Sach cho thieu nhi va tuoi moi lon voi tinh giao duc, tri tuong tuong va long nhan ai.',
      enDescription:
        'Children and YA books blending imagination, empathy, and age-appropriate life lessons.',
    },
    {
      slug: 'education-skills',
      sortOrder: 21,
      viName: 'Hoc tap va ky nang',
      enName: 'Education & Skills',
      viDescription:
        'Nhom sach huong dan ky nang hoc tap, giao tiep, ngoai ngu va nang cao nang luc ca nhan.',
      enDescription:
        'Education and skills books on learning methods, communication, language, and self-improvement.',
    },
    {
      slug: 'language-learning',
      sortOrder: 22,
      parentSlug: 'education-skills',
      viName: 'Hoc ngoai ngu',
      enName: 'Language Learning',
      viDescription:
        'Sach hoc ngoai ngu theo ngu canh thuc te, nhanh nho va de ap dung trong giao tiep.',
      enDescription:
        'Language learning books with context-driven methods for practical communication fluency.',
    },
    {
      slug: 'productivity-learning',
      sortOrder: 23,
      parentSlug: 'education-skills',
      viName: 'Nang suat va phuong phap hoc',
      enName: 'Productivity & Learning',
      viDescription:
        'Sach ve quan ly thoi gian, tap trung sau va xay dung he thong hoc tap ben vung.',
      enDescription:
        'Books on deep focus, time management, and building sustainable long-term learning systems.',
    },
    {
      slug: 'communication',
      sortOrder: 24,
      parentSlug: 'education-skills',
      viName: 'Giao tiep',
      enName: 'Communication',
      viDescription:
        'Sach ren luyen ky nang trinh bay, dam phan, phan hoi va giao tiep da ngu canh.',
      enDescription:
        'Communication books for presentations, negotiation, feedback culture, and collaboration.',
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
        description: category.viDescription,
      },
      create: {
        categoryId,
        languageId: viLanguageId,
        name: category.viName,
        slug: category.slug,
        description: category.viDescription,
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
        description: category.enDescription,
      },
      create: {
        categoryId,
        languageId: enLanguageId,
        name: category.enName,
        slug: category.slug,
        description: category.enDescription,
      },
    });

    categoryIdBySlug.set(category.slug, categoryId);
  }

  return categoryIdBySlug;
}

const PUBLISHER_NAMES = [
  'NXB Tre',
  'NXB Tong Hop TP.HCM',
  'Lighthouse Press',
  'Global Knowledge House',
  'Blue River Books',
  'Alpha Insight Publishing',
  'Open Mind Media',
  'North Star Books',
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

type BookBlueprint = {
  viTitle: string;
  enTitle: string;
  focusVi: string;
  focusEn: string;
  categorySlugs: [string, string];
  basePrice: number;
  variantCount: 1 | 2 | 3;
  useAudioTier?: boolean;
};

const BOOK_BLUEPRINTS: BookBlueprint[] = [
  { viTitle: 'Lam chu TypeScript thuc chien', enTitle: 'Mastering TypeScript in Production', focusVi: 'xay dung ung dung lon voi typing chat che va kha nang refactor an toan', focusEn: 'building large applications with strict typing and safe refactoring workflows', categorySlugs: ['programming', 'software-architecture'], basePrice: 162000, variantCount: 3 },
  { viTitle: 'Clean Architecture cho Node.js', enTitle: 'Clean Architecture for Node.js', focusVi: 'tach domain ro rang va giam do phuc tap khi mo rong he thong backend', focusEn: 'separating domain boundaries and reducing complexity in scalable Node.js backends', categorySlugs: ['software-architecture', 'programming'], basePrice: 178000, variantCount: 3 },
  { viTitle: 'Thiet ke API hieu nang cao', enTitle: 'High-Performance API Design', focusVi: 'toi uu API cho latency, thong luong va do tin cay trong moi truong production', focusEn: 'optimizing APIs for latency, throughput, and reliability in production systems', categorySlugs: ['programming', 'software-architecture'], basePrice: 186000, variantCount: 2 },
  { viTitle: 'DevOps tu Docker den Kubernetes', enTitle: 'DevOps from Docker to Kubernetes', focusVi: 'xay dung quy trinh CI/CD on dinh va van hanh cloud native', focusEn: 'building stable CI/CD workflows and operating cloud-native workloads', categorySlugs: ['devops-cloud', 'technology'], basePrice: 194000, variantCount: 3 },
  { viTitle: 'Zero downtime deployment playbook', enTitle: 'Zero-Downtime Deployment Playbook', focusVi: 'trien khai he thong khong gian doan voi rollback ro rang va quan sat du lieu day du', focusEn: 'deploying systems without downtime using safe rollbacks and full observability', categorySlugs: ['devops-cloud', 'software-architecture'], basePrice: 191000, variantCount: 2 },
  { viTitle: 'Bao mat ung dung web hien dai', enTitle: 'Modern Web Security Blueprint', focusVi: 'phong thu theo chieu sau cho ung dung web va API trong doanh nghiep', focusEn: 'applying defense-in-depth to web applications and enterprise APIs', categorySlugs: ['cybersecurity', 'technology'], basePrice: 199000, variantCount: 3 },
  { viTitle: 'Data engineering voi Python', enTitle: 'Practical Data Engineering with Python', focusVi: 'thiet ke pipeline du lieu ben vung va de bao tri theo thoi gian', focusEn: 'designing durable and maintainable data pipelines over time', categorySlugs: ['data-ai', 'technology'], basePrice: 172000, variantCount: 2 },
  { viTitle: 'Machine learning cho san pham', enTitle: 'Applied Machine Learning for Products', focusVi: 'dua mo hinh ML vao san pham that voi vong doi cap nhat lien tuc', focusEn: 'shipping machine-learning features to real products with iterative model updates', categorySlugs: ['data-ai', 'business-economics'], basePrice: 182000, variantCount: 3 },
  { viTitle: 'Kien truc he thong phan tan', enTitle: 'Distributed Systems Design Handbook', focusVi: 'can bang consistency, availability va failover cho he thong quy mo lon', focusEn: 'balancing consistency, availability, and failover in distributed systems', categorySlugs: ['software-architecture', 'devops-cloud'], basePrice: 205000, variantCount: 2 },
  { viTitle: 'Testing strategy cho codebase lon', enTitle: 'Testing Strategy for Large Codebases', focusVi: 'xay bo test nhieu lop de giam regression va tang toc do release', focusEn: 'building multi-layer test strategy to reduce regressions and speed up releases', categorySlugs: ['programming', 'software-architecture'], basePrice: 168000, variantCount: 2 },
  { viTitle: 'Tang truong startup ben vung', enTitle: 'Sustainable Startup Growth', focusVi: 'tim product-market fit va xay dung bo may tang truong khong dot chay nguon luc', focusEn: 'finding product-market fit and building sustainable growth engines', categorySlugs: ['entrepreneurship', 'business-economics'], basePrice: 176000, variantCount: 2 },
  { viTitle: 'Quan tri san pham so', enTitle: 'Digital Product Management', focusVi: 'dinh huong roadmap theo du lieu va nhu cau khach hang thuc te', focusEn: 'driving product roadmaps with customer insight and evidence-based priorities', categorySlugs: ['management-leadership', 'business-economics'], basePrice: 183000, variantCount: 2 },
  { viTitle: 'Lanh dao doi ngu ky thuat', enTitle: 'Leading Engineering Teams', focusVi: 'phat trien van hoa ownership va su truong thanh cua doi ngu ky su', focusEn: 'building ownership culture and capability growth in engineering teams', categorySlugs: ['management-leadership', 'technology'], basePrice: 189000, variantCount: 2 },
  { viTitle: 'Tai chinh ca nhan cho nguoi tre', enTitle: 'Personal Finance for Young Professionals', focusVi: 'xay he thong quan ly tien bac, du phong va dau tu dai han', focusEn: 'building personal money systems for safety, planning, and long-term investing', categorySlugs: ['finance-investing', 'business-economics'], basePrice: 154000, variantCount: 3 },
  { viTitle: 'Doc hieu bao cao tai chinh', enTitle: 'Reading Financial Statements', focusVi: 'hieu nhanh bang can doi, dong tien va chi so cot loi cua doanh nghiep', focusEn: 'reading balance sheets, cash flows, and key business health indicators', categorySlugs: ['finance-investing', 'business-economics'], basePrice: 171000, variantCount: 2 },
  { viTitle: 'Content marketing co chuyen doi', enTitle: 'Content Marketing that Converts', focusVi: 'xay dung thong diep dung doi tuong va toi uu hanh trinh chuyen doi', focusEn: 'crafting audience-fit messaging and improving end-to-end conversion journeys', categorySlugs: ['marketing-sales', 'business-economics'], basePrice: 162000, variantCount: 2 },
  { viTitle: 'Dam phan trong cong viec', enTitle: 'Negotiation at Work', focusVi: 'dam phan muc tieu va loi ich ma van giu quan he hop tac dai han', focusEn: 'negotiating outcomes while preserving long-term collaborative relationships', categorySlugs: ['communication', 'management-leadership'], basePrice: 158000, variantCount: 2 },
  { viTitle: 'Xay dung thuong hieu ca nhan', enTitle: 'Building a Credible Personal Brand', focusVi: 'xac lap ban sac chuyen mon va su tin nhiem trong nganh', focusEn: 'establishing professional identity and trust in a competitive market', categorySlugs: ['marketing-sales', 'communication'], basePrice: 149000, variantCount: 2 },
  { viTitle: 'Van hanh doanh nghiep tinh gon', enTitle: 'Lean Operations for SMEs', focusVi: 'chuan hoa quy trinh de giam lang phi va tang toc do thuc thi', focusEn: 'standardizing operations to reduce waste and increase execution velocity', categorySlugs: ['management-leadership', 'entrepreneurship'], basePrice: 166000, variantCount: 2 },
  { viTitle: 'Business analytics bang SQL', enTitle: 'Business Analytics with SQL', focusVi: 'chuyen du lieu giao dich thanh thong tin ho tro quyet dinh dieu hanh', focusEn: 'turning transactional data into insights for operational and strategic decisions', categorySlugs: ['data-ai', 'business-economics'], basePrice: 173000, variantCount: 3 },
  { viTitle: 'Tam ly hoc hanh vi va quyet dinh', enTitle: 'Behavioral Psychology and Decisions', focusVi: 'nhan dien dinh kien nhan thuc de cai thien chat luong quyet dinh', focusEn: 'identifying cognitive bias to improve everyday and strategic decisions', categorySlugs: ['psychology', 'mind-society'], basePrice: 151000, variantCount: 2 },
  { viTitle: 'Ky luat mem cho thoi quen ben vung', enTitle: 'Gentle Discipline Habit System', focusVi: 'xay dung thoi quen nho nhung ben, tranh kien tri kieu dot pha ngan han', focusEn: 'building small but sustainable habits instead of short-lived bursts', categorySlugs: ['productivity-learning', 'psychology'], basePrice: 139000, variantCount: 1 },
  { viTitle: 'Tap trung sau trong thoi dai so', enTitle: 'Deep Focus in a Distracted World', focusVi: 'tao moi truong lam viec giup nao bo giam xao nhang va tang output chat luong', focusEn: 'creating focus-friendly systems to reduce distractions and improve output quality', categorySlugs: ['productivity-learning', 'psychology'], basePrice: 148000, variantCount: 2 },
  { viTitle: 'Giao tiep khong bao luc noi lam viec', enTitle: 'Nonviolent Communication at Work', focusVi: 'phan hoi kho van xay dung duoc su ton trong va hop tac', focusEn: 'handling difficult feedback while preserving respect and collaboration', categorySlugs: ['communication', 'psychology'], basePrice: 146000, variantCount: 1 },
  { viTitle: 'Quan ly stress va nang luong', enTitle: 'Stress and Energy Management', focusVi: 'can bang tai tao nang luong de duy tri hieu suat duong dai', focusEn: 'managing stress and restoring energy for long-term performance', categorySlugs: ['psychology', 'productivity-learning'], basePrice: 144000, variantCount: 1 },
  { viTitle: 'Lich su Viet Nam can dai qua goc kinh te', enTitle: 'Modern Vietnam through Economic Lenses', focusVi: 'giai ma bien dong lich su thong qua dong luc kinh te va cai cach the che', focusEn: 'reading historical transitions through economic dynamics and institutional reform', categorySlugs: ['history', 'mind-society'], basePrice: 163000, variantCount: 2 },
  { viTitle: 'Lich su the gioi cho nguoi ban ron', enTitle: 'World History for Busy Minds', focusVi: 'nam bat cac moc lon de hieu boi canh hien tai va tuong lai', focusEn: 'capturing major turning points to better understand today and tomorrow', categorySlugs: ['history', 'mind-society'], basePrice: 159000, variantCount: 2 },
  { viTitle: 'Triet hoc ung dung moi ngay', enTitle: 'Practical Philosophy for Everyday Life', focusVi: 'ung dung triet hoc de song ro rang gia tri va co lap luan mach lac', focusEn: 'using philosophy to clarify values and reason with consistency', categorySlugs: ['philosophy', 'mind-society'], basePrice: 152000, variantCount: 1 },
  { viTitle: 'Tu duy phan bien va nguy bien', enTitle: 'Critical Thinking and Fallacies', focusVi: 'nhan dien lap luan sai de tranh quyet dinh voi du lieu thieu chat luong', focusEn: 'spotting flawed reasoning before it affects decisions and strategy', categorySlugs: ['philosophy', 'education-skills'], basePrice: 157000, variantCount: 2 },
  { viTitle: 'Cong dan so va dao duc AI', enTitle: 'Digital Citizenship and AI Ethics', focusVi: 'hieu trach nhiem su dung du lieu va cong nghe trong xa hoi so', focusEn: 'understanding responsibility, data rights, and ethics in digital society', categorySlugs: ['social-issues', 'technology'], basePrice: 169000, variantCount: 2 },
  { viTitle: 'Mua mua tren pho co', enTitle: 'Monsoon on the Old Quarter', focusVi: 'tieu thuyet khac hoa nhan vat thanh thi qua nhung lua chon day rung dong', focusEn: 'a city novel about identity, memory, and consequential life choices', categorySlugs: ['fiction', 'literature-arts'], basePrice: 138000, variantCount: 3, useAudioTier: true },
  { viTitle: 'Dem thang sau: tuyen tap truyen ngan', enTitle: 'June Night Short Stories', focusVi: 'truyen ngan tinh gon nhung de lai nhieu du am tam ly va nhan van', focusEn: 'compact short stories with emotional aftertaste and human complexity', categorySlugs: ['short-stories', 'literature-arts'], basePrice: 132000, variantCount: 2, useAudioTier: true },
  { viTitle: 'Hanh trinh qua mien ky uc', enTitle: 'Journey Through Memory', focusVi: 'nhat ky van hoc ve gia dinh, mat mat va hanh trinh hoa giai', focusEn: 'a literary journey through family, loss, and reconciliation', categorySlugs: ['fiction', 'short-stories'], basePrice: 135000, variantCount: 1 },
  { viTitle: 'Thanh pho cua may', enTitle: 'City of Clouds', focusVi: 'truyen thieu nhi ve tinh ban, su dung cam va tri tuong tuong phong phu', focusEn: 'a children story about friendship, courage, and creative imagination', categorySlugs: ['children-ya', 'literature-arts'], basePrice: 128000, variantCount: 3, useAudioTier: true },
  { viTitle: 'Cua so thu bay', enTitle: 'The Seventh Window', focusVi: 'truyen tuoi moi lon ve danh tinh, gia dinh va hanh trinh truong thanh', focusEn: 'a YA coming-of-age story about identity, family, and growth', categorySlugs: ['children-ya', 'fiction'], basePrice: 133000, variantCount: 2, useAudioTier: true },
  { viTitle: 'Viet sang tao tu so 0', enTitle: 'Creative Writing from Zero', focusVi: 'huong dan viet chuyen nghiep tu y tuong den ban thao hoan chinh', focusEn: 'a practical guide from raw ideas to polished and publishable drafts', categorySlugs: ['education-skills', 'literature-arts'], basePrice: 154000, variantCount: 2 },
  { viTitle: '3000 tu vung tieng Anh theo ngu canh', enTitle: '3000 English Words in Context', focusVi: 'mo rong von tu voi ngu canh doi thoai va bai tap nho lau', focusEn: 'expanding vocabulary through context-rich dialogue and retention drills', categorySlugs: ['language-learning', 'education-skills'], basePrice: 147000, variantCount: 3, useAudioTier: true },
  { viTitle: 'Ngu phap tieng Anh ung dung giao tiep', enTitle: 'Practical English Grammar for Conversation', focusVi: 'chu tich ngu phap de noi va viet chinh xac trong moi truong lam viec', focusEn: 'using grammar patterns to speak and write clearly in real situations', categorySlugs: ['language-learning', 'education-skills'], basePrice: 143000, variantCount: 2, useAudioTier: true },
  { viTitle: 'Doc nhanh va ghi nho sau', enTitle: 'Speed Reading and Retention System', focusVi: 'ket hop ky thuat doc nhanh voi ghi chu de nho kien thuc lau hon', focusEn: 'combining speed reading with memory techniques for durable learning', categorySlugs: ['productivity-learning', 'education-skills'], basePrice: 141000, variantCount: 1 },
  { viTitle: 'Tu hoc suot doi theo he thong', enTitle: 'Lifelong Self-Learning Systems', focusVi: 'xay bo quy trinh hoc tap tu chu de nang cap nang luc lien tuc', focusEn: 'building self-directed learning systems for continuous capability growth', categorySlugs: ['productivity-learning', 'education-skills'], basePrice: 156000, variantCount: 2 },
];

const CATEGORY_PLAYBOOK: Record<
  string,
  { vi: string[]; en: string[] }
> = {
  programming: {
    vi: [
      'xac dinh nguyen tac thiet ke va coding standard',
      'trien khai tung ky thuat tren codebase thuc te',
      'xay bo test va pipeline kiem tra chat luong',
      'do luong hieu nang va giam regression',
      'hoan thien checklist de ap dung vao du an that',
    ],
    en: [
      'set clear engineering principles and coding standards',
      'apply each technique on realistic codebase scenarios',
      'build quality gates with layered automated testing',
      'measure performance and reduce regressions over time',
      'finish with an actionable production checklist',
    ],
  },
  'software-architecture': {
    vi: [
      'phan ra domain boundary va trach nhiem module',
      'thiet ke luong du lieu va contract giua cac thanh phan',
      'xu ly loi, retry va fallback theo cap do',
      'quy hoach mo rong va kha nang bao tri dai han',
      'dao tao doi ngu de van hanh kien truc thong nhat',
    ],
    en: [
      'define domain boundaries and module responsibilities',
      'design data flow contracts across system components',
      'implement layered retry, fallback, and failure handling',
      'plan scalability and long-term maintainability tradeoffs',
      'align team execution around a coherent architecture model',
    ],
  },
  'devops-cloud': {
    vi: [
      'chuan hoa quy trinh build test deploy',
      'container hoa ung dung va toi uu image',
      'thiet lap quan sat he thong theo metric log trace',
      'bao ve moi truong production voi canary va rollback',
      'xay van hoa van hanh lien tuc giua dev va ops',
    ],
    en: [
      'standardize build-test-deploy flow end to end',
      'containerize workloads with optimized image strategy',
      'set up observability through metrics, logs, and traces',
      'protect production with canary rollout and rollback',
      'build a shared DevOps operating culture across teams',
    ],
  },
  psychology: {
    vi: [
      'nhan dien co che tam ly tac dong den hanh vi',
      'trien khai bai tap tu quan sat de thay doi thoi quen',
      'ung dung giao tiep phu hop boi canh cong viec',
      'do luong tien bo bang chi so hanh vi cu the',
      'duy tri ket qua bang he thong ho tro ben vung',
    ],
    en: [
      'identify psychological drivers behind recurring behavior',
      'apply self-observation exercises to change habits',
      'use context-aware communication in real work settings',
      'track progress through concrete behavior indicators',
      'sustain outcomes with practical support systems',
    ],
  },
  history: {
    vi: [
      'tong hop boi canh kinh te chinh tri xa hoi',
      'phan tich nhan qua cua cac bien co lon',
      'doi chieu nhieu goc nhin va nguon tai lieu',
      'rut ra bai hoc cho quan tri hien tai',
      'xay khung tham chieu de tiep tuc tu hoc',
    ],
    en: [
      'map economic, political, and social context clearly',
      'analyze causality behind major turning points',
      'compare perspectives across multiple source types',
      'extract operational lessons for present decisions',
      'build a framework for further historical learning',
    ],
  },
};

const DEFAULT_PLAYBOOK = {
  vi: [
    'xac dinh muc tieu hoc tap ro rang ngay tu dau',
    'chia nho van de de de thuc hanh va do luong',
    'ap dung tinh huong thuc te de tang tinh kha dung',
    'tong hop bai hoc thanh quy trinh co the lap lai',
    'xay lo trinh nang cap nang luc dai han',
  ],
  en: [
    'define clear learning outcomes from the start',
    'break complexity into measurable practical steps',
    'apply concepts in realistic scenarios and constraints',
    'synthesize lessons into repeatable operating workflows',
    'build a long-term capability growth roadmap',
  ],
};

const REVIEW_CONTENT_BY_RATING: Record<number, string[]> = {
  1: ['Noi dung khong dung nhu ky vong.'],
  2: ['Tam on nhung chua xung dang gia tien.'],
  3: ['Sach o muc on, co the tham khao.'],
  4: ['Noi dung ro rang, de ung dung trong cong viec.'],
  5: ['Rat chat luong, doc xong ap dung duoc ngay.'],
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

function buildSeedIsbn(bookNumber: number, variantNumber: number) {
  const prefix = `978604${bookNumber.toString().padStart(3, '0')}${variantNumber}`;
  const body = `${prefix}${((bookNumber * 7 + variantNumber * 3) % 97).toString().padStart(2, '0')}`;
  const twelveDigits = body.slice(0, 12);
  const checksum = twelveDigits
    .split('')
    .map((digit) => Number(digit))
    .reduce((sum, digit, idx) => sum + digit * (idx % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (checksum % 10)) % 10;
  return `${twelveDigits}${checkDigit}`;
}

function resolveVariantFormats(blueprint: BookBlueprint): BookFormat[] {
  if (blueprint.variantCount === 1) {
    return [BookFormat.PAPERBACK];
  }
  if (blueprint.variantCount === 2) {
    return [BookFormat.PAPERBACK, BookFormat.HARDCOVER];
  }
  if (blueprint.useAudioTier) {
    return [BookFormat.EBOOK, BookFormat.PAPERBACK, BookFormat.AUDIOBOOK];
  }
  return [BookFormat.EBOOK, BookFormat.PAPERBACK, BookFormat.HARDCOVER];
}

function buildViDescription(blueprint: BookBlueprint, code: string) {
  const playbook =
    CATEGORY_PLAYBOOK[blueprint.categorySlugs[0]] ?? DEFAULT_PLAYBOOK;
  const modules = playbook.vi.map((line, idx) => `- Chuong ${idx + 1}: ${line}.`).join('\n');

  return [
    `${blueprint.viTitle} (${code}) la cuon sach duoc bien soan de giai quyet bai toan: ${blueprint.focusVi}.`,
    'Noi dung khong chi dung o muc khai niem. Moi chuong deu co case study, checklist van hanh va bai tap de doc gia co the trien khai ngay vao cong viec.',
    'Cau truc sach duoc thiet ke theo lo trinh nang cao dan, giup nguoi moi van theo kip, dong thoi van du do sau cho doc gia da co kinh nghiem.',
    'Khung noi dung chinh:',
    modules,
    'Ban dich tieng Viet duoc bien tap theo van phong de hieu, uu tien tinh ung dung va kha nang tai su dung kien thuc trong boi canh doi ngu san pham.',
  ].join('\n\n');
}

function buildEnDescription(blueprint: BookBlueprint, code: string) {
  const playbook =
    CATEGORY_PLAYBOOK[blueprint.categorySlugs[0]] ?? DEFAULT_PLAYBOOK;
  const modules = playbook.en.map((line, idx) => `- Part ${idx + 1}: ${line}.`).join('\n');

  return [
    `${blueprint.enTitle} (${code}) is built around one practical objective: ${blueprint.focusEn}.`,
    'Instead of abstract theory, each chapter includes realistic case studies, implementation checklists, and execution exercises you can apply immediately.',
    'The progression is intentionally structured from fundamentals to advanced patterns, so both early-career and experienced readers gain clear value.',
    'Core learning path:',
    modules,
    'The English edition keeps concise technical language, explicit trade-off analysis, and a strong focus on production-grade decision making.',
  ].join('\n\n');
}

function buildSeedBooks(categorySlugs: string[]): SeedBook[] {
  if (BOOK_BLUEPRINTS.length !== BOOK_COUNT) {
    throw new Error(
      `BOOK_BLUEPRINTS length must be ${BOOK_COUNT}, got ${BOOK_BLUEPRINTS.length}`,
    );
  }

  const books: SeedBook[] = [];
  for (let i = 1; i <= BOOK_COUNT; i += 1) {
    const blueprint = BOOK_BLUEPRINTS[i - 1];
    const code = i.toString().padStart(3, '0');
    const selectedCategories = blueprint.categorySlugs.filter((slug) =>
      categorySlugs.includes(slug),
    );

    if (!selectedCategories.length) {
      selectedCategories.push(...takeRandomUnique(categorySlugs, 2));
    }

    const formats = resolveVariantFormats(blueprint);
    const variants = formats.map((format, index) => {
      const price = toRoundedVnd(blueprint.basePrice * Math.pow(1.1, index));
      const costPrice = toRoundedVnd(price * (0.62 + 0.03 * index));
      const stock =
        format === BookFormat.EBOOK || format === BookFormat.AUDIOBOOK
          ? randomInt(1200, 9000)
          : randomInt(40, 260);

      return {
        format,
        edition: 1,
        isbn: buildSeedIsbn(i, index + 1),
        costPrice,
        price,
        currencyCode: CURRENCY_CODE_VND,
        stock,
      };
    });

    const pageCount = 220 + ((i * 37) % 360);
    books.push({
      slug: `seed-book-${code}`,
      viTitle: blueprint.viTitle,
      enTitle: blueprint.enTitle,
      viDescription: buildViDescription(blueprint, code),
      enDescription: buildEnDescription(blueprint, code),
      coverImageUrl: `https://picsum.photos/seed/seed-book-${code}/720/1080`,
      publicationYear: 2010 + (i % 16),
      pageCount,
      weightGrams: 260 + Math.round(pageCount * 1.65),
      publisherName: PUBLISHER_NAMES[(i - 1) % PUBLISHER_NAMES.length],
      categories: selectedCategories.slice(0, 2),
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
        bookVariantId: row.bookVariantId,
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
    const expiredAt = new Date(placedAt.getTime() + ORDER_EXPIRED_SECONDS * 1000);

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
        expiredAt,
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
  console.log(`Seeded total users: ${fixedUsers.length + seededCustomers.length}`);

  try {
    // Dọn dữ liệu seed cũ phần order/review để không bị lẫn dữ liệu cũ.
    await prisma.order.deleteMany({
      where: { orderCode: { startsWith: ORDER_CODE_PREFIX } },
    });
    await prisma.review.deleteMany({
      where: { content: { startsWith: REVIEW_CONTENT_PREFIX } },
    });
    await prisma.bookVariantSnapshot.deleteMany({
      where: { skuSnapshot: { startsWith: 'SEED-SKU-' } },
    });

    const categoryIdBySlug = await upsertCatalogCategories(languageIdByCode);
    const { books, variants } = await upsertCatalogBooks(
      languageIdByCode,
      categoryIdBySlug,
    );
    const snapshots = await upsertVariantSnapshots(variants);

    console.log(`Seeded books: ${books.length}`);
    console.log(`Seeded variants: ${variants.length}`);
    console.log(`Seeded snapshots: ${snapshots.length}`);
    console.log('Seeded orders: 0 (disabled in this seed version)');
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
