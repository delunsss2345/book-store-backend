
import { PermissionCode } from '@/common/constants/permission-pattern.constant';
// prisma/seed.ts
//
// Seed dữ liệu cho hệ thống bán sách:
// - Languages (vi/en), Roles, Permissions, Suppliers
// - Categories đa cấp (catalog) kèm bản dịch vi/en
// - ~100 cuốn sách CÓ THẬT (ISBN-13 thật, đã verify checksum) + author + publisher + variant + snapshot
// - Users cố định (admin/staff/warehouse/guest) + nhiều customer, MỖI customer có NHIỀU địa chỉ (UserAddress)
// - Guest sessions (khách không đăng nhập), có cart/order riêng
// - Một số đơn hàng (Order/OrderItem/OrderAddress/PaymentTransaction) demo cho cả user đã đăng nhập và guest
//
// Không seed Review (model không tồn tại trong schema hiện tại).
//
// Cách chạy:
//   npx prisma db push          (hoặc migrate dev nếu đã có migration)
//   npx ts-node prisma/seed.ts  (hoặc khai báo "prisma": { "seed": "ts-node prisma/seed.ts" } trong package.json rồi `npx prisma db seed`)

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  Badge,
  BookFormat,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  PrismaClient,
  RoleCode,
  UserStatus
} from '@prisma/client';
import bcrypt from 'bcrypt';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// =============================================================================
// Helpers
// =============================================================================

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

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ORDER_EXPIRED_SECONDS = 30 * 60; // 30 phút, mặc định nếu project chưa có hằng số riêng
const CURRENCY_CODE_VND = 'VND';
const CUSTOMER_COUNT = 24;
const ORDER_CODE_PREFIX = 'SEED-ORD-';
const GUEST_ORDER_COUNT = 10;
const USER_ORDER_COUNT = 40;

// =============================================================================
// 1. Suppliers
// =============================================================================

type SeedSupplier = { code: string; name: string };

const SUPPLIERS: SeedSupplier[] = [
  { code: 'SUP-FAHASA', name: 'Công ty Phát hành sách Fahasa' },
  { code: 'SUP-PNB', name: 'Công ty Sách Phương Nam' },
  { code: 'SUP-ALPHA', name: 'Công ty Cổ phần Sách Alpha Books' },
  { code: 'SUP-THAIHA', name: 'Công ty Sách Thái Hà' },
  { code: 'SUP-TRITHUC', name: 'Nhà sách Tri Thức' },
  { code: 'SUP-GLOBAL', name: 'Công ty Phân phối Sách Global' },
  { code: 'SUP-NORTHSTAR', name: 'Nhà phát hành North Star' },
  { code: 'SUP-BLUERIVER', name: 'Công ty Sách Blue River' },
];

async function upsertSuppliers() {
  for (const s of SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      update: { name: s.name, isActive: true },
      create: { code: s.code, name: s.name, isActive: true },
    });
  }

  const rows = await prisma.supplier.findMany({ select: { id: true, code: true } });
  return new Map(rows.map((x) => [x.code, x.id] as const));
}

// =============================================================================
// 2. Roles (RBAC) — không seed Permission chi tiết để tránh phụ thuộc enum
//    PermissionCode không còn trong scope file này; chỉ tạo Role cơ bản.
// =============================================================================
async function upsertPermissions() {
  const permissions: any[] = [
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
      code: PermissionCode.SUPPLIER_READ,
      method: 'GET',
      pathPattern: '/api/v1/suppliers',
      description: 'List suppliers',
    },
    {
      code: PermissionCode.SUPPLIER_CREATE,
      method: 'POST',
      pathPattern: '/api/v1/suppliers',
      description: 'Create supplier',
    },
    {
      code: PermissionCode.SUPPLIER_UPDATE,
      method: 'PATCH',
      pathPattern: '/api/v1/suppliers/:supplierId/active',
      description: 'Toggle supplier active status',
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

    // Bổ sung permission đang bị thiếu
    {
      code: PermissionCode.ADMIN_READ_DETAIL,
      method: 'GET',
      pathPattern: '/api/v1/admin/books/:bookId',
      description: 'Read admin book detail',
    },

    {
      code: PermissionCode.ADMIN_READ,
      method: 'GET',
      pathPattern: '/api/v1/admin/*',
      description: 'Read admin resources',
    },

    {
      code: PermissionCode.UPLOAD_MANAGE,
      method: 'POST',
      pathPattern: '/api/v1/uploads/*',
      description: 'Upload files and confirm book assets',
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
        method: p.method,
        pathPattern: p.pathPattern,
        isActive: p.isActive ?? true,
        deletedAt: null,
      },
      create: {
        code: p.code,
        description: p.description,
        method: p.method,
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
  roleIdByCode: Map<RoleCode, number>,
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
      update: { name: r.name, description: r.description, isActive: true },
      create: { code: r.code, name: r.name, description: r.description, isActive: true },
    });
  }

  const rows = await prisma.role.findMany({ select: { id: true, code: true } });
  return new Map(rows.map((x) => [x.code, x.id] as const));
}

// =============================================================================
// 3. Languages
// =============================================================================

async function upsertLanguages() {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Tiếng Việt' },
  ];

  for (const l of languages) {
    await prisma.language.upsert({
      where: { code: l.code },
      update: { name: l.name, isActive: true },
      create: { code: l.code, name: l.name, isActive: true },
    });
  }

  const rows = await prisma.language.findMany({ select: { id: true, code: true } });
  return new Map(rows.map((row) => [row.code, row.id] as const));
}

// =============================================================================
// 4. Categories (đa cấp, có bản dịch vi/en)
// =============================================================================

type SeedCategory = {
  slug: string;
  sortOrder: number;
  viName: string;
  enName: string;
  parentSlug?: string;
  viDescription: string;
  enDescription: string;
};

const CATEGORIES: SeedCategory[] = [
  {
    slug: 'technology',
    sortOrder: 1,
    viName: 'Công nghệ',
    enName: 'Technology',
    viDescription: 'Nhóm sách về công nghệ hiện đại, gồm lập trình, vận hành hệ thống, bảo mật và dữ liệu.',
    enDescription: 'Technology books covering programming, infrastructure, security, and modern data systems.',
  },
  {
    slug: 'programming',
    sortOrder: 2,
    parentSlug: 'technology',
    viName: 'Lập trình',
    enName: 'Programming',
    viDescription: 'Sách tập trung kỹ thuật coding thực chiến, clean code, testing và tối ưu chất lượng phần mềm.',
    enDescription: 'Hands-on coding books focused on clean code, testing, and practical engineering quality.',
  },
  {
    slug: 'software-architecture',
    sortOrder: 3,
    parentSlug: 'technology',
    viName: 'Kiến trúc phần mềm',
    enName: 'Software Architecture',
    viDescription: 'Nội dung về kiến trúc hệ thống, phân rã domain, mở rộng và vận hành ổn định trên quy mô lớn.',
    enDescription: 'Software architecture, domain boundaries, scalability, and resilient system design at scale.',
  },
  {
    slug: 'devops-cloud',
    sortOrder: 4,
    parentSlug: 'technology',
    viName: 'DevOps và Cloud',
    enName: 'DevOps & Cloud',
    viDescription: 'Sách về CI/CD, container, cloud native và quản trị hạ tầng theo hướng tự động hóa.',
    enDescription: 'DevOps and cloud-native books on CI/CD, containers, automation, and infrastructure operations.',
  },
  {
    slug: 'cybersecurity',
    sortOrder: 5,
    parentSlug: 'technology',
    viName: 'An toàn thông tin',
    enName: 'Cybersecurity',
    viDescription: 'Kiến thức về phòng thủ ứng dụng, quản lý rủi ro và triển khai bảo mật trong vòng đời sản phẩm.',
    enDescription: 'Cybersecurity practices for secure-by-design software, threat modeling, and risk management.',
  },
  {
    slug: 'data-ai',
    sortOrder: 6,
    parentSlug: 'technology',
    viName: 'Dữ liệu và AI',
    enName: 'Data & AI',
    viDescription: 'Sách về data engineering, phân tích dữ liệu và ứng dụng machine learning cho bài toán thực tế.',
    enDescription: 'Data engineering, analytics, and applied AI books for production-ready decision systems.',
  },
  {
    slug: 'business-economics',
    sortOrder: 7,
    viName: 'Kinh doanh và kinh tế',
    enName: 'Business & Economics',
    viDescription: 'Nhóm sách về tăng trưởng doanh nghiệp, vận hành, chiến lược sản phẩm và mô hình tài chính.',
    enDescription: 'Business and economics titles about growth, operations, product strategy, and financial models.',
  },
  {
    slug: 'entrepreneurship',
    sortOrder: 8,
    parentSlug: 'business-economics',
    viName: 'Khởi nghiệp',
    enName: 'Entrepreneurship',
    viDescription: 'Sách cho nhà sáng lập: xác thực ý tưởng, tìm product-market fit và xây dựng đội ngũ ban đầu.',
    enDescription: 'Entrepreneurship books on validation, product-market fit, and early team execution.',
  },
  {
    slug: 'management-leadership',
    sortOrder: 9,
    parentSlug: 'business-economics',
    viName: 'Quản trị và lãnh đạo',
    enName: 'Management & Leadership',
    viDescription: 'Nội dung về vận hành đội ngũ, đánh giá hiệu suất, lập kế hoạch và ra quyết định lãnh đạo.',
    enDescription: 'Management and leadership books on team operations, planning, feedback, and decision quality.',
  },
  {
    slug: 'marketing-sales',
    sortOrder: 10,
    parentSlug: 'business-economics',
    viName: 'Marketing và bán hàng',
    enName: 'Marketing & Sales',
    viDescription: 'Sách hướng dẫn xây dựng thông điệp, kênh tiếp cận và hệ thống chuyển đổi doanh thu ổn định.',
    enDescription: 'Books on positioning, channel strategy, and conversion-focused marketing and sales execution.',
  },
  {
    slug: 'finance-investing',
    sortOrder: 11,
    parentSlug: 'business-economics',
    viName: 'Tài chính và đầu tư',
    enName: 'Finance & Investing',
    viDescription: 'Sách tài chính cá nhân, phân tích báo cáo tài chính và các nguyên tắc đầu tư bền vững.',
    enDescription: 'Finance books covering personal money systems, statement analysis, and long-term investing.',
  },
  {
    slug: 'mind-society',
    sortOrder: 12,
    viName: 'Tâm trí và xã hội',
    enName: 'Mind & Society',
    viDescription: 'Nhóm sách khai phá hành vi con người, bối cảnh xã hội và tư duy để hiểu sâu các quyết định.',
    enDescription: 'Mind and society books exploring behavior, culture, institutions, and decision dynamics.',
  },
  {
    slug: 'psychology',
    sortOrder: 13,
    parentSlug: 'mind-society',
    viName: 'Tâm lý học',
    enName: 'Psychology',
    viDescription: 'Sách tâm lý ứng dụng cho học tập, công việc và quản lý bản thân theo hướng thực hành.',
    enDescription: 'Practical psychology books for habits, motivation, communication, and personal effectiveness.',
  },
  {
    slug: 'history',
    sortOrder: 14,
    parentSlug: 'mind-society',
    viName: 'Lịch sử',
    enName: 'History',
    viDescription: 'Sách lịch sử theo hướng tổng hợp bối cảnh, nhân quả và bài học cho hiện tại.',
    enDescription: 'History titles connecting context, causality, and practical lessons for current society.',
  },
  {
    slug: 'philosophy',
    sortOrder: 15,
    parentSlug: 'mind-society',
    viName: 'Triết học',
    enName: 'Philosophy',
    viDescription: 'Sách triết học ứng dụng giúp làm rõ hệ giá trị, nâng cao năng lực lập luận và phản biện.',
    enDescription: 'Applied philosophy books for reasoning, ethics, values, and structured critical thinking.',
  },
  {
    slug: 'social-issues',
    sortOrder: 16,
    parentSlug: 'mind-society',
    viName: 'Vấn đề xã hội',
    enName: 'Social Issues',
    viDescription: 'Sách phân tích những thách thức xã hội đương đại như công dân số, đạo đức dữ liệu và AI.',
    enDescription: 'Books on modern social issues such as digital citizenship, data ethics, and AI governance.',
  },
  {
    slug: 'literature-arts',
    sortOrder: 17,
    viName: 'Văn học và nghệ thuật',
    enName: 'Literature & Arts',
    viDescription: 'Nhóm sách văn học với giá trị cảm xúc, ngôn ngữ và nghệ thuật kể chuyện.',
    enDescription: 'Literature and arts books centered on narrative craft, language, and emotional depth.',
  },
  {
    slug: 'fiction',
    sortOrder: 18,
    parentSlug: 'literature-arts',
    viName: 'Tiểu thuyết',
    enName: 'Fiction',
    viDescription: 'Tiểu thuyết đương đại và kinh điển, khắc họa nhân vật rõ nét và xung đột đầy sức nặng.',
    enDescription: 'Fiction titles with strong character arcs, layered conflicts, and memorable narrative voice.',
  },
  {
    slug: 'short-stories',
    sortOrder: 19,
    parentSlug: 'literature-arts',
    viName: 'Truyện ngắn',
    enName: 'Short Stories',
    viDescription: 'Tuyển tập truyện ngắn tinh gọn, giàu hình ảnh và một kết thúc có dư âm.',
    enDescription: 'Short story collections with concise structure, vivid imagery, and resonant endings.',
  },
  {
    slug: 'children-ya',
    sortOrder: 20,
    parentSlug: 'literature-arts',
    viName: 'Thiếu nhi và tuổi mới lớn',
    enName: 'Children & YA',
    viDescription: 'Sách cho thiếu nhi và tuổi mới lớn với tính giáo dục, trí tưởng tượng và lòng nhân ái.',
    enDescription: 'Children and YA books blending imagination, empathy, and age-appropriate life lessons.',
  },
  {
    slug: 'education-skills',
    sortOrder: 21,
    viName: 'Học tập và kỹ năng',
    enName: 'Education & Skills',
    viDescription: 'Nhóm sách hướng dẫn kỹ năng học tập, giao tiếp, ngoại ngữ và nâng cao năng lực cá nhân.',
    enDescription: 'Education and skills books on learning methods, communication, language, and self-improvement.',
  },
  {
    slug: 'language-learning',
    sortOrder: 22,
    parentSlug: 'education-skills',
    viName: 'Học ngoại ngữ',
    enName: 'Language Learning',
    viDescription: 'Sách học ngoại ngữ theo ngữ cảnh thực tế, nhanh nhớ và dễ áp dụng trong giao tiếp.',
    enDescription: 'Language learning books with context-driven methods for practical communication fluency.',
  },
  {
    slug: 'productivity-learning',
    sortOrder: 23,
    parentSlug: 'education-skills',
    viName: 'Năng suất và phương pháp học',
    enName: 'Productivity & Learning',
    viDescription: 'Sách về quản lý thời gian, tập trung sâu và xây dựng hệ thống học tập bền vững.',
    enDescription: 'Books on deep focus, time management, and building sustainable long-term learning systems.',
  },
  {
    slug: 'communication',
    sortOrder: 24,
    parentSlug: 'education-skills',
    viName: 'Giao tiếp',
    enName: 'Communication',
    viDescription: 'Sách rèn luyện kỹ năng trình bày, đàm phán, phản hồi và giao tiếp đa ngữ cảnh.',
    enDescription: 'Communication books for presentations, negotiation, feedback culture, and collaboration.',
  },
];

async function upsertCategories(languageIdByCode: Map<string, number>) {
  const viLanguageId = languageIdByCode.get('vi');
  const enLanguageId = languageIdByCode.get('en');
  if (!viLanguageId || !enLanguageId) {
    throw new Error('Missing vi/en language seed');
  }

  const categoryIdBySlug = new Map<string, number>();

  for (const category of CATEGORIES) {
    const parentId = category.parentSlug
      ? categoryIdBySlug.get(category.parentSlug) ?? null
      : null;

    const existing = await prisma.categoryTranslation.findFirst({
      where: { languageId: viLanguageId, slug: category.slug },
      select: { categoryId: true },
    });

    let categoryId: number;
    if (existing) {
      categoryId = existing.categoryId;
      await prisma.category.update({
        where: { id: categoryId },
        data: { parentId, isActive: true, sortOrder: category.sortOrder, deletedAt: null },
      });
    } else {
      const created = await prisma.category.create({
        data: { parentId, isActive: true, sortOrder: category.sortOrder },
        select: { id: true },
      });
      categoryId = created.id;
    }

    await prisma.categoryTranslation.upsert({
      where: { categoryId_languageId: { categoryId, languageId: viLanguageId } },
      update: { name: category.viName, slug: category.slug, description: category.viDescription },
      create: {
        categoryId,
        languageId: viLanguageId,
        name: category.viName,
        slug: category.slug,
        description: category.viDescription,
      },
    });

    await prisma.categoryTranslation.upsert({
      where: { categoryId_languageId: { categoryId, languageId: enLanguageId } },
      update: { name: category.enName, slug: category.slug, description: category.enDescription },
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

// =============================================================================
// 5. Real books data (~100 cuốn sách CÓ THẬT, ISBN-13 thật, đã verify checksum)
// =============================================================================

type RealBookSeed = {
  title: string;
  author: string;
  publisher: string;
  isbn13: string;
  publicationYear: number;
  pageCount: number;
  categorySlugs: string[];
  priceVnd: number;
  descriptionVi: string;
  descriptionEn: string;
};

const REAL_BOOKS: RealBookSeed[] = [
  // ===================== Programming / Software Architecture / DevOps / Cybersecurity / Data & AI =====================
  { title: 'Clean Code', author: 'Robert C. Martin', publisher: 'Prentice Hall', isbn13: '9780132350884', publicationYear: 2008, pageCount: 464, categorySlugs: ['programming'], priceVnd: 320000, descriptionVi: 'Cuốn sách kinh điển về viết mã sạch, dễ đọc và dễ bảo trì, được nhiều kỹ sư phần mềm coi là sách nhập môn bắt buộc.', descriptionEn: 'A classic guide to writing readable, maintainable code, widely considered required reading for software engineers.' },
  { title: 'The Pragmatic Programmer', author: 'David Thomas, Andrew Hunt', publisher: 'Addison-Wesley', isbn13: '9780135957059', publicationYear: 2019, pageCount: 352, categorySlugs: ['programming'], priceVnd: 350000, descriptionVi: 'Bộ nguyên tắc và thói quen thực hành giúp lập trình viên trở nên chuyên nghiệp và hiệu quả hơn.', descriptionEn: 'A set of practical principles and habits to help developers become more effective and professional.' },
  { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', publisher: 'Addison-Wesley', isbn13: '9780201633610', publicationYear: 1994, pageCount: 395, categorySlugs: ['software-architecture', 'programming'], priceVnd: 380000, descriptionVi: 'Tác phẩm nền tảng giới thiệu 23 mẫu thiết kế hướng đối tượng kinh điển.', descriptionEn: 'The foundational text introducing 23 classic object-oriented design patterns.' },
  { title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', publisher: 'Addison-Wesley', isbn13: '9780134757599', publicationYear: 2018, pageCount: 448, categorySlugs: ['programming', 'software-architecture'], priceVnd: 360000, descriptionVi: 'Hướng dẫn từng bước để cải thiện cấu trúc mã nguồn mà không thay đổi hành vi của nó.', descriptionEn: 'A step-by-step guide to improving code structure without changing its external behavior.' },
  { title: 'Clean Architecture', author: 'Robert C. Martin', publisher: 'Prentice Hall', isbn13: '9780134494166', publicationYear: 2017, pageCount: 432, categorySlugs: ['software-architecture'], priceVnd: 340000, descriptionVi: 'Nguyên lý thiết kế kiến trúc phần mềm giúp hệ thống dễ mở rộng và bảo trì lâu dài.', descriptionEn: 'Design principles for software architecture that keep systems flexible and maintainable over time.' },
  { title: 'Building Microservices', author: 'Sam Newman', publisher: "O'Reilly Media", isbn13: '9781492034025', publicationYear: 2021, pageCount: 600, categorySlugs: ['software-architecture', 'devops-cloud'], priceVnd: 420000, descriptionVi: 'Hướng dẫn toàn diện về thiết kế, triển khai và vận hành hệ thống microservices.', descriptionEn: 'A comprehensive guide to designing, deploying, and operating microservices-based systems.' },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', publisher: "O'Reilly Media", isbn13: '9781449373320', publicationYear: 2017, pageCount: 616, categorySlugs: ['software-architecture', 'data-ai'], priceVnd: 450000, descriptionVi: 'Phân tích sâu về các hệ thống dữ liệu phân tán, độ tin cậy và khả năng mở rộng.', descriptionEn: 'A deep dive into distributed data systems, reliability, and scalability trade-offs.' },
  { title: 'The Phoenix Project', author: 'Gene Kim, Kevin Behr, George Spafford', publisher: 'IT Revolution Press', isbn13: '9780988262591', publicationYear: 2013, pageCount: 432, categorySlugs: ['devops-cloud', 'management-leadership'], priceVnd: 280000, descriptionVi: 'Tiểu thuyết kinh doanh về chuyển đổi IT, giúp người đọc hiểu trực quan về DevOps.', descriptionEn: 'A business novel about IT transformation that makes DevOps principles intuitive.' },
  { title: 'The DevOps Handbook', author: 'Gene Kim, Jez Humble, Patrick Debois, John Willis', publisher: 'IT Revolution Press', isbn13: '9781942788003', publicationYear: 2016, pageCount: 480, categorySlugs: ['devops-cloud'], priceVnd: 390000, descriptionVi: 'Hướng dẫn thực hành để xây dựng văn hóa DevOps và cải thiện tốc độ triển khai.', descriptionEn: 'A practical guide to building DevOps culture and improving deployment velocity.' },
  { title: 'Kubernetes Up and Running', author: 'Kelsey Hightower, Brendan Burns, Joe Beda', publisher: "O'Reilly Media", isbn13: '9781492046530', publicationYear: 2019, pageCount: 277, categorySlugs: ['devops-cloud'], priceVnd: 410000, descriptionVi: 'Giới thiệu thực tiễn về cách triển khai và quản lý ứng dụng trên Kubernetes.', descriptionEn: 'A hands-on introduction to deploying and managing applications on Kubernetes.' },
  { title: 'Site Reliability Engineering', author: 'Niall Richard Murphy, Betsy Beyer, Chris Jones, Jennifer Petoff', publisher: "O'Reilly Media", isbn13: '9781491929124', publicationYear: 2016, pageCount: 552, categorySlugs: ['devops-cloud', 'software-architecture'], priceVnd: 430000, descriptionVi: 'Cách Google vận hành hệ thống quy mô lớn với độ tin cậy cao thông qua kỹ thuật SRE.', descriptionEn: "How Google runs large-scale systems reliably through site reliability engineering practices." },
  { title: 'The Web Application Hacker\u2019s Handbook', author: 'Dafydd Stuttard, Marcus Pinto', publisher: 'Wiley', isbn13: '9781118026472', publicationYear: 2011, pageCount: 912, categorySlugs: ['cybersecurity'], priceVnd: 480000, descriptionVi: 'Cẩm nang chi tiết về cách phát hiện và khai thác lỗ hổng trong ứng dụng web.', descriptionEn: 'A detailed manual on discovering and exploiting security flaws in web applications.' },
  { title: 'Hacking: The Art of Exploitation', author: 'Jon Erickson', publisher: 'No Starch Press', isbn13: '9781593271442', publicationYear: 2008, pageCount: 488, categorySlugs: ['cybersecurity'], priceVnd: 350000, descriptionVi: 'Giải thích các kỹ thuật hacking từ góc độ lập trình hệ thống và bảo mật mạng.', descriptionEn: 'Explains hacking techniques from the perspective of systems programming and network security.' },
  { title: 'Applied Cryptography', author: 'Bruce Schneier', publisher: 'Wiley', isbn13: '9781119096726', publicationYear: 2015, pageCount: 784, categorySlugs: ['cybersecurity'], priceVnd: 460000, descriptionVi: 'Tài liệu tham khảo toàn diện về các thuật toán và giao thức mật mã ứng dụng.', descriptionEn: 'A comprehensive reference on applied cryptographic algorithms and protocols.' },
  { title: 'Python for Data Analysis', author: 'Wes McKinney', publisher: "O'Reilly Media", isbn13: '9781491957660', publicationYear: 2017, pageCount: 550, categorySlugs: ['data-ai', 'programming'], priceVnd: 400000, descriptionVi: 'Hướng dẫn dùng Python và pandas để xử lý, phân tích dữ liệu hiệu quả.', descriptionEn: 'A guide to using Python and pandas for effective data wrangling and analysis.' },
  { title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow', author: 'Aurélien Géron', publisher: "O'Reilly Media", isbn13: '9781492032649', publicationYear: 2019, pageCount: 819, categorySlugs: ['data-ai'], priceVnd: 470000, descriptionVi: 'Hướng dẫn thực hành xây dựng các mô hình machine learning từ cơ bản đến nâng cao.', descriptionEn: 'A hands-on guide to building machine learning models from fundamentals to advanced topics.' },
  { title: 'Deep Learning', author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', publisher: 'MIT Press', isbn13: '9780262035613', publicationYear: 2016, pageCount: 800, categorySlugs: ['data-ai'], priceVnd: 520000, descriptionVi: 'Giáo trình nền tảng toàn diện về deep learning được viết bởi các chuyên gia hàng đầu.', descriptionEn: 'A comprehensive foundational textbook on deep learning written by leading researchers.' },
  { title: 'Storytelling with Data', author: 'Cole Nussbaumer Knaflic', publisher: 'Wiley', isbn13: '9781119002253', publicationYear: 2015, pageCount: 288, categorySlugs: ['data-ai', 'business-economics'], priceVnd: 310000, descriptionVi: 'Hướng dẫn trình bày dữ liệu rõ ràng, thuyết phục để hỗ trợ ra quyết định.', descriptionEn: 'A guide to presenting data clearly and persuasively to support decision-making.' },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', publisher: 'MIT Press', isbn13: '9780262046305', publicationYear: 2022, pageCount: 1312, categorySlugs: ['programming', 'data-ai'], priceVnd: 550000, descriptionVi: 'Giáo trình thuật toán kinh điển được sử dụng rộng rãi trong các trường đại học.', descriptionEn: 'The classic algorithms textbook used widely across university computer science programs.' },
  { title: 'You Don\u2019t Know JS Yet', author: 'Kyle Simpson', publisher: 'Independently Published', isbn13: '9798602477429', publicationYear: 2020, pageCount: 278, categorySlugs: ['programming'], priceVnd: 220000, descriptionVi: 'Khám phá những góc khó hiểu nhưng quan trọng của ngôn ngữ JavaScript.', descriptionEn: 'Explores the tricky but important parts of the JavaScript language in depth.' },
  { title: 'Database Internals', author: 'Alex Petrov', publisher: "O'Reilly Media", isbn13: '9781492040347', publicationYear: 2019, pageCount: 376, categorySlugs: ['data-ai', 'software-architecture'], priceVnd: 420000, descriptionVi: 'Giải thích cách các hệ quản trị cơ sở dữ liệu phân tán hoạt động bên trong.', descriptionEn: 'Explains how distributed database systems work under the hood.' },

  // ===================== Business & Economics / Entrepreneurship / Management / Marketing / Finance =====================
  { title: 'The Lean Startup', author: 'Eric Ries', publisher: 'Crown Business', isbn13: '9780307887894', publicationYear: 2011, pageCount: 336, categorySlugs: ['entrepreneurship', 'business-economics'], priceVnd: 250000, descriptionVi: 'Phương pháp khởi nghiệp tinh gọn giúp doanh nghiệp kiểm chứng ý tưởng nhanh và hiệu quả.', descriptionEn: 'A lean methodology for startups to validate ideas quickly and efficiently.' },
  { title: 'Zero to One', author: 'Peter Thiel, Blake Masters', publisher: 'Crown Business', isbn13: '9780804139298', publicationYear: 2014, pageCount: 224, categorySlugs: ['entrepreneurship'], priceVnd: 230000, descriptionVi: 'Quan điểm độc đáo về cách xây dựng doanh nghiệp tạo ra giá trị đột phá.', descriptionEn: 'A distinctive perspective on building companies that create breakthrough value.' },
  { title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', publisher: 'Harper Business', isbn13: '9780062273208', publicationYear: 2014, pageCount: 304, categorySlugs: ['entrepreneurship', 'management-leadership'], priceVnd: 260000, descriptionVi: 'Những bài học thực tế và khó khăn nhất trong quá trình xây dựng và điều hành công ty.', descriptionEn: 'Hard-won lessons about the most difficult parts of building and running a company.' },
  { title: 'Good to Great', author: 'Jim Collins', publisher: 'HarperBusiness', isbn13: '9780066620992', publicationYear: 2001, pageCount: 320, categorySlugs: ['management-leadership', 'business-economics'], priceVnd: 270000, descriptionVi: 'Nghiên cứu về điều gì giúp một số công ty chuyển từ tốt sang vĩ đại.', descriptionEn: 'A research-driven look at what makes some companies leap from good to great.' },
  { title: 'The Innovator\u2019s Dilemma', author: 'Clayton M. Christensen', publisher: 'Harvard Business Review Press', isbn13: '9781633691780', publicationYear: 2016, pageCount: 286, categorySlugs: ['business-economics', 'management-leadership'], priceVnd: 290000, descriptionVi: 'Lý thuyết về đổi mới gây gián đoạn và lý do các công ty dẫn đầu thất bại.', descriptionEn: 'A theory of disruptive innovation explaining why leading companies fail.' },
  { title: 'Measure What Matters', author: 'John Doerr', publisher: 'Portfolio', isbn13: '9780525536222', publicationYear: 2018, pageCount: 320, categorySlugs: ['management-leadership', 'business-economics'], priceVnd: 280000, descriptionVi: 'Phương pháp OKR giúp doanh nghiệp đặt mục tiêu và đo lường kết quả hiệu quả.', descriptionEn: 'The OKR methodology for setting goals and measuring results effectively.' },
  { title: 'Radical Candor', author: 'Kim Scott', publisher: "St. Martin's Press", isbn13: '9781250103505', publicationYear: 2017, pageCount: 320, categorySlugs: ['management-leadership', 'communication'], priceVnd: 260000, descriptionVi: 'Cách lãnh đạo hiệu quả bằng sự quan tâm cá nhân kết hợp phản hồi thẳng thắn.', descriptionEn: 'How to lead effectively by combining personal care with direct feedback.' },
  { title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni', publisher: 'Jossey-Bass', isbn13: '9780787960759', publicationYear: 2002, pageCount: 229, categorySlugs: ['management-leadership'], priceVnd: 220000, descriptionVi: 'Mô hình giải thích nguyên nhân gốc rễ khiến các nhóm làm việc không hiệu quả.', descriptionEn: 'A model explaining the root causes behind dysfunctional team performance.' },
  { title: 'Crossing the Chasm', author: 'Geoffrey A. Moore', publisher: 'Harper Business', isbn13: '9780062292988', publicationYear: 2014, pageCount: 254, categorySlugs: ['marketing-sales', 'entrepreneurship'], priceVnd: 260000, descriptionVi: 'Chiến lược tiếp thị sản phẩm công nghệ cho thị trường đại chúng.', descriptionEn: 'A marketing strategy for taking technology products into the mainstream market.' },
  { title: 'Influence: The Psychology of Persuasion', author: 'Robert B. Cialdini', publisher: 'Harper Business', isbn13: '9780061241895', publicationYear: 2006, pageCount: 336, categorySlugs: ['marketing-sales', 'psychology'], priceVnd: 240000, descriptionVi: 'Khám phá sáu nguyên tắc tâm lý ảnh hưởng đến quyết định và hành vi con người.', descriptionEn: 'Explores six psychological principles that influence human decisions and behavior.' },
  { title: 'Made to Stick', author: 'Chip Heath, Dan Heath', publisher: 'Random House', isbn13: '9781400064281', publicationYear: 2007, pageCount: 291, categorySlugs: ['marketing-sales', 'communication'], priceVnd: 230000, descriptionVi: 'Lý do tại sao một số ý tưởng tồn tại lâu trong tâm trí còn số khác bị quên lãng.', descriptionEn: 'Why some ideas stick in our minds while others are quickly forgotten.' },
  { title: 'This Is Marketing', author: 'Seth Godin', publisher: 'Portfolio', isbn13: '9780525540830', publicationYear: 2018, pageCount: 256, categorySlugs: ['marketing-sales'], priceVnd: 220000, descriptionVi: 'Quan điểm hiện đại về tiếp thị tập trung vào việc tạo ra giá trị thực sự cho khách hàng.', descriptionEn: 'A modern view of marketing focused on creating real value for a specific audience.' },
  { title: 'The Intelligent Investor', author: 'Benjamin Graham', publisher: 'Harper Business', isbn13: '9780060555665', publicationYear: 2006, pageCount: 640, categorySlugs: ['finance-investing'], priceVnd: 300000, descriptionVi: 'Kinh thánh đầu tư giá trị, nền tảng triết lý đầu tư của Warren Buffett.', descriptionEn: 'The bible of value investing that shaped Warren Buffett\u2019s investment philosophy.' },
  { title: 'Rich Dad Poor Dad', author: 'Robert T. Kiyosaki', publisher: 'Plata Publishing', isbn13: '9781612680194', publicationYear: 2017, pageCount: 258, categorySlugs: ['finance-investing'], priceVnd: 180000, descriptionVi: 'Bài học tài chính cá nhân qua câu chuyện về hai người cha với quan điểm khác nhau.', descriptionEn: 'Personal finance lessons told through the contrasting views of two father figures.' },
  { title: 'The Psychology of Money', author: 'Morgan Housel', publisher: 'Harriman House', isbn13: '9780857197689', publicationYear: 2020, pageCount: 256, categorySlugs: ['finance-investing', 'psychology'], priceVnd: 210000, descriptionVi: 'Cách hành vi và tâm lý ảnh hưởng đến quyết định tài chính nhiều hơn là kiến thức thuần túy.', descriptionEn: 'How behavior and psychology shape financial decisions more than pure knowledge does.' },
  { title: 'A Random Walk Down Wall Street', author: 'Burton G. Malkiel', publisher: 'W. W. Norton & Company', isbn13: '9781324051138', publicationYear: 2023, pageCount: 464, categorySlugs: ['finance-investing'], priceVnd: 290000, descriptionVi: 'Phân tích các chiến lược đầu tư và lý do đầu tư chỉ số dài hạn thường hiệu quả.', descriptionEn: 'An analysis of investing strategies and why long-term index investing tends to win.' },
  { title: 'Principles: Life and Work', author: 'Ray Dalio', publisher: 'Simon & Schuster', isbn13: '9781501124020', publicationYear: 2017, pageCount: 592, categorySlugs: ['business-economics', 'management-leadership'], priceVnd: 320000, descriptionVi: 'Những nguyên tắc sống và làm việc được rút ra từ kinh nghiệm điều hành quỹ đầu tư lớn.', descriptionEn: 'Life and work principles drawn from running one of the world\u2019s largest investment funds.' },

  // ===================== Psychology / History / Philosophy / Social Issues =====================
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', publisher: 'Farrar, Straus and Giroux', isbn13: '9780374533557', publicationYear: 2013, pageCount: 499, categorySlugs: ['psychology'], priceVnd: 260000, descriptionVi: 'Khám phá hai hệ thống tư duy chi phối cách con người ra quyết định.', descriptionEn: 'Explores the two systems of thought that drive human decision-making.' },
  { title: 'Atomic Habits', author: 'James Clear', publisher: 'Avery', isbn13: '9780735211292', publicationYear: 2018, pageCount: 320, categorySlugs: ['psychology', 'productivity-learning'], priceVnd: 220000, descriptionVi: 'Phương pháp xây dựng thói quen tốt và loại bỏ thói quen xấu một cách bền vững.', descriptionEn: 'A method for building good habits and breaking bad ones in a sustainable way.' },
  { title: 'Mindset: The New Psychology of Success', author: 'Carol S. Dweck', publisher: 'Ballantine Books', isbn13: '9780345472328', publicationYear: 2007, pageCount: 320, categorySlugs: ['psychology'], priceVnd: 210000, descriptionVi: 'Phân biệt tư duy cố định và tư duy phát triển, cùng tác động đến thành công.', descriptionEn: 'Distinguishes fixed and growth mindsets and their impact on long-term success.' },
  { title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', publisher: 'Viking', isbn13: '9780670785933', publicationYear: 2014, pageCount: 464, categorySlugs: ['psychology'], priceVnd: 280000, descriptionVi: 'Nghiên cứu về cách sang chấn tâm lý ảnh hưởng đến cơ thể và tâm trí.', descriptionEn: 'A study of how psychological trauma reshapes both body and mind.' },
  { title: 'Man\u2019s Search for Meaning', author: 'Viktor E. Frankl', publisher: 'Beacon Press', isbn13: '9780807014295', publicationYear: 2006, pageCount: 184, categorySlugs: ['psychology', 'philosophy'], priceVnd: 150000, descriptionVi: 'Hồi ký và triết lý sống của một bác sĩ tâm lý sống sót qua trại tập trung.', descriptionEn: 'A memoir and philosophy of meaning by a psychiatrist who survived the concentration camps.' },
  { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', publisher: 'Harper', isbn13: '9780062316097', publicationYear: 2015, pageCount: 464, categorySlugs: ['history', 'mind-society'], priceVnd: 270000, descriptionVi: 'Hành trình lịch sử loài người từ thời kỳ săn bắt hái lượm đến văn minh hiện đại.', descriptionEn: 'A sweeping history of humankind from foraging origins to modern civilization.' },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', publisher: 'W. W. Norton & Company', isbn13: '9780393317558', publicationYear: 1999, pageCount: 480, categorySlugs: ['history'], priceVnd: 260000, descriptionVi: 'Giải thích vì sao một số nền văn minh phát triển vượt trội hơn các nền văn minh khác.', descriptionEn: 'Explains why some civilizations advanced faster and farther than others.' },
  { title: 'A People\u2019s History of the United States', author: 'Howard Zinn', publisher: 'Harper Perennial', isbn13: '9780062397348', publicationYear: 2005, pageCount: 729, categorySlugs: ['history', 'social-issues'], priceVnd: 290000, descriptionVi: 'Lịch sử Hoa Kỳ được kể từ góc nhìn của những người dân thường thay vì giới cầm quyền.', descriptionEn: 'American history told from the perspective of ordinary people rather than the powerful.' },
  { title: 'The Diary of a Young Girl', author: 'Anne Frank', publisher: 'Bantam', isbn13: '9780553296983', publicationYear: 1993, pageCount: 283, categorySlugs: ['history', 'literature-arts'], priceVnd: 150000, descriptionVi: 'Nhật ký chân thực của một thiếu nữ Do Thái trong thời kỳ Thế chiến thứ hai.', descriptionEn: 'The poignant diary of a young Jewish girl in hiding during World War II.' },
  { title: 'Meditations', author: 'Marcus Aurelius', publisher: 'Modern Library', isbn13: '9780812968255', publicationYear: 2003, pageCount: 304, categorySlugs: ['philosophy'], priceVnd: 160000, descriptionVi: 'Suy ngẫm triết học khắc kỷ của một hoàng đế La Mã về cách sống đức hạnh.', descriptionEn: 'Stoic philosophical reflections by a Roman emperor on living a virtuous life.' },
  { title: 'The Republic', author: 'Plato', publisher: 'Penguin Classics', isbn13: '9780140455113', publicationYear: 2007, pageCount: 416, categorySlugs: ['philosophy'], priceVnd: 170000, descriptionVi: 'Tác phẩm triết học kinh điển bàn về công lý, chính trị và bản chất nhà nước lý tưởng.', descriptionEn: 'A classic philosophical dialogue on justice, politics, and the ideal state.' },
  { title: 'Beyond Good and Evil', author: 'Friedrich Nietzsche', publisher: 'Penguin Classics', isbn13: '9780140449235', publicationYear: 1990, pageCount: 256, categorySlugs: ['philosophy'], priceVnd: 160000, descriptionVi: 'Phê phán triết học truyền thống và đề xuất cách nhìn mới về đạo đức và quyền lực.', descriptionEn: 'A critique of traditional philosophy proposing a new view on morality and power.' },
  { title: 'The Art of War', author: 'Sun Tzu', publisher: 'Shambhala', isbn13: '9781590302255', publicationYear: 2005, pageCount: 273, categorySlugs: ['philosophy', 'management-leadership'], priceVnd: 150000, descriptionVi: 'Binh pháp cổ xưa của Trung Quốc, được ứng dụng rộng rãi trong kinh doanh và lãnh đạo hiện đại.', descriptionEn: 'An ancient Chinese military treatise widely applied to modern business and leadership.' },
  { title: 'Weapons of Math Destruction', author: 'Cathy O\u2019Neil', publisher: 'Crown', isbn13: '9780553418811', publicationYear: 2016, pageCount: 272, categorySlugs: ['social-issues', 'data-ai'], priceVnd: 230000, descriptionVi: 'Cảnh báo về cách các thuật toán dữ liệu lớn có thể khuếch đại bất công xã hội.', descriptionEn: 'A warning on how big-data algorithms can amplify inequality and social harm.' },
  { title: 'The Age of Surveillance Capitalism', author: 'Shoshana Zuboff', publisher: 'PublicAffairs', isbn13: '9781610395694', publicationYear: 2019, pageCount: 704, categorySlugs: ['social-issues', 'technology'], priceVnd: 320000, descriptionVi: 'Phân tích cách các công ty công nghệ khai thác dữ liệu cá nhân để tạo lợi nhuận.', descriptionEn: 'An analysis of how tech companies extract and monetize personal data at scale.' },

  // ===================== Fiction / Short Stories / Children-YA / Literature =====================
  { title: '1984', author: 'George Orwell', publisher: 'Signet Classics', isbn13: '9780451524935', publicationYear: 1961, pageCount: 328, categorySlugs: ['fiction'], priceVnd: 150000, descriptionVi: 'Tiểu thuyết phản địa đàng kinh điển về một xã hội bị giám sát và kiểm soát toàn diện.', descriptionEn: 'A classic dystopian novel about a totalitarian society under constant surveillance.' },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', publisher: 'Harper Perennial', isbn13: '9780060935467', publicationYear: 2002, pageCount: 336, categorySlugs: ['fiction'], priceVnd: 160000, descriptionVi: 'Câu chuyện cảm động về công lý và phân biệt chủng tộc ở miền Nam nước Mỹ.', descriptionEn: 'A moving story about justice and racial inequality in the American South.' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', publisher: 'Scribner', isbn13: '9780743273565', publicationYear: 2004, pageCount: 180, categorySlugs: ['fiction'], priceVnd: 130000, descriptionVi: 'Bức tranh hào nhoáng nhưng bi kịch về giấc mơ Mỹ thời kỳ Jazz Age.', descriptionEn: 'A glittering yet tragic portrait of the American Dream during the Jazz Age.' },
  { title: 'Pride and Prejudice', author: 'Jane Austen', publisher: 'Penguin Classics', isbn13: '9780141439518', publicationYear: 2003, pageCount: 480, categorySlugs: ['fiction'], priceVnd: 140000, descriptionVi: 'Tiểu thuyết tình cảm kinh điển xoay quanh định kiến, hôn nhân và tầng lớp xã hội Anh.', descriptionEn: 'A classic romantic novel about prejudice, marriage, and English social class.' },
  { title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', publisher: 'Harper Perennial', isbn13: '9780060883287', publicationYear: 2006, pageCount: 417, categorySlugs: ['fiction'], priceVnd: 180000, descriptionVi: 'Tác phẩm hiện thực huyền ảo kể về nhiều thế hệ của một gia đình ở Macondo.', descriptionEn: 'A magical realist saga following generations of the Buendía family in Macondo.' },
  { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', publisher: 'Vintage Classics', isbn13: '9780679734505', publicationYear: 1993, pageCount: 560, categorySlugs: ['fiction'], priceVnd: 190000, descriptionVi: 'Hành trình tâm lý phức tạp của một sinh viên sau khi phạm tội giết người.', descriptionEn: 'A psychologically intense journey of a student after committing murder.' },
  { title: 'The Catcher in the Rye', author: 'J. D. Salinger', publisher: "Little, Brown and Company", isbn13: '9780316769488', publicationYear: 1991, pageCount: 277, categorySlugs: ['fiction', 'children-ya'], priceVnd: 150000, descriptionVi: 'Câu chuyện về tuổi trẻ nổi loạn và sự lạc lõng của một thiếu niên thành thị.', descriptionEn: 'A story of teenage alienation and rebellion told by a restless young narrator.' },
  { title: 'Brave New World', author: 'Aldous Huxley', publisher: 'Harper Perennial', isbn13: '9780060850524', publicationYear: 2006, pageCount: 288, categorySlugs: ['fiction'], priceVnd: 150000, descriptionVi: 'Một xã hội tương lai nơi hạnh phúc được sản xuất công nghiệp và cá tính bị xóa bỏ.', descriptionEn: 'A future society where happiness is mass-produced and individuality is erased.' },
  { title: 'The Old Man and the Sea', author: 'Ernest Hemingway', publisher: 'Scribner', isbn13: '9780684801223', publicationYear: 1995, pageCount: 127, categorySlugs: ['fiction', 'short-stories'], priceVnd: 110000, descriptionVi: 'Câu chuyện ngắn gọn nhưng sâu sắc về lòng kiên trì của một ông lão đánh cá.', descriptionEn: 'A short but profound story of an old fisherman\u2019s endurance and dignity.' },
  { title: 'Of Mice and Men', author: 'John Steinbeck', publisher: 'Penguin Books', isbn13: '9780140177398', publicationYear: 1993, pageCount: 107, categorySlugs: ['fiction', 'short-stories'], priceVnd: 110000, descriptionVi: 'Câu chuyện cảm động về tình bạn và ước mơ trong thời kỳ Đại khủng hoảng.', descriptionEn: 'A moving story of friendship and dreams during the Great Depression.' },
  { title: 'Dubliners', author: 'James Joyce', publisher: 'Penguin Classics', isbn13: '9780140186475', publicationYear: 2000, pageCount: 256, categorySlugs: ['short-stories', 'literature-arts'], priceVnd: 130000, descriptionVi: 'Tuyển tập truyện ngắn khắc họa đời sống thường nhật ở Dublin đầu thế kỷ 20.', descriptionEn: 'A short story collection portraying everyday life in early 20th-century Dublin.' },
  { title: 'Nine Stories', author: 'J. D. Salinger', publisher: "Little, Brown and Company", isbn13: '9780316769501', publicationYear: 1991, pageCount: 224, categorySlugs: ['short-stories'], priceVnd: 130000, descriptionVi: 'Chín truyện ngắn đặc trưng cho phong cách viết tinh tế và đầy ẩn ý của Salinger.', descriptionEn: 'Nine short stories showcasing Salinger\u2019s subtle, layered narrative style.' },
  { title: 'Harry Potter and the Sorcerer\u2019s Stone', author: 'J. K. Rowling', publisher: 'Scholastic', isbn13: '9780590353427', publicationYear: 1998, pageCount: 309, categorySlugs: ['children-ya', 'fiction'], priceVnd: 170000, descriptionVi: 'Khởi đầu hành trình phép thuật của chú bé Harry Potter tại trường Hogwarts.', descriptionEn: 'The beginning of Harry Potter\u2019s magical journey at Hogwarts School.' },
  { title: 'The Hobbit', author: 'J. R. R. Tolkien', publisher: 'Houghton Mifflin Harcourt', isbn13: '9780547928227', publicationYear: 2012, pageCount: 300, categorySlugs: ['children-ya', 'fiction'], priceVnd: 170000, descriptionVi: 'Cuộc hành trình kỳ thú của Bilbo Baggins cùng các chú lùn đi tìm lại kho báu.', descriptionEn: 'Bilbo Baggins\u2019 unexpected adventure with dwarves to reclaim a lost treasure.' },
  { title: 'Charlotte\u2019s Web', author: 'E. B. White', publisher: 'HarperCollins', isbn13: '9780064400558', publicationYear: 1974, pageCount: 192, categorySlugs: ['children-ya'], priceVnd: 120000, descriptionVi: 'Câu chuyện cảm động về tình bạn giữa một con lợn và một con nhện thông minh.', descriptionEn: 'A touching story of friendship between a pig and a clever, caring spider.' },
  { title: 'The Giving Tree', author: 'Shel Silverstein', publisher: 'Harper & Row', isbn13: '9780060256654', publicationYear: 1964, pageCount: 64, categorySlugs: ['children-ya'], priceVnd: 90000, descriptionVi: 'Câu chuyện ngắn giàu cảm xúc về tình yêu vô điều kiện và sự hy sinh.', descriptionEn: 'A short, emotional story about unconditional love and selfless giving.' },
  { title: 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe', author: 'C. S. Lewis', publisher: 'HarperCollins', isbn13: '9780064404990', publicationYear: 1994, pageCount: 206, categorySlugs: ['children-ya', 'fiction'], priceVnd: 150000, descriptionVi: 'Bốn anh em bước qua cánh tủ áo và lạc vào thế giới phép thuật Narnia.', descriptionEn: 'Four siblings step through a wardrobe into the magical world of Narnia.' },
  { title: 'Matilda', author: 'Roald Dahl', publisher: 'Puffin Books', isbn13: '9780142410370', publicationYear: 2007, pageCount: 240, categorySlugs: ['children-ya'], priceVnd: 130000, descriptionVi: 'Cô bé Matilda thông minh khác thường đối đầu với người lớn độc đoán bằng trí tuệ và lòng tốt.', descriptionEn: 'A brilliant young girl outsmarts overbearing adults with wit and kindness.' },
  { title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', publisher: 'Harcourt', isbn13: '9780156012195', publicationYear: 2000, pageCount: 96, categorySlugs: ['children-ya', 'fiction'], priceVnd: 100000, descriptionVi: 'Câu chuyện ngụ ngôn giàu triết lý về tình yêu, sự cô đơn và bản chất con người.', descriptionEn: 'A philosophical fable about love, loneliness, and the nature of being human.' },
  { title: 'Norwegian Wood', author: 'Haruki Murakami', publisher: 'Vintage International', isbn13: '9780375704024', publicationYear: 2000, pageCount: 296, categorySlugs: ['fiction', 'literature-arts'], priceVnd: 160000, descriptionVi: 'Câu chuyện tình yêu và mất mát đầy chất thơ của một sinh viên đại học Nhật Bản.', descriptionEn: 'A poetic story of love and loss following a Japanese university student.' },

  // ===================== Education & Skills / Language Learning / Productivity / Communication =====================
  { title: 'Make It Stick', author: 'Peter C. Brown, Henry L. Roediger III, Mark A. McDaniel', publisher: 'Belknap Press', isbn13: '9780674729018', publicationYear: 2014, pageCount: 336, categorySlugs: ['productivity-learning', 'education-skills'], priceVnd: 250000, descriptionVi: 'Tổng hợp các nghiên cứu khoa học về phương pháp học tập hiệu quả và ghi nhớ lâu dài.', descriptionEn: 'A research-backed synthesis of effective learning strategies for durable memory.' },
  { title: 'Deep Work', author: 'Cal Newport', publisher: 'Grand Central Publishing', isbn13: '9781455586691', publicationYear: 2016, pageCount: 304, categorySlugs: ['productivity-learning'], priceVnd: 230000, descriptionVi: 'Phương pháp làm việc tập trung sâu để tạo ra giá trị vượt trội trong thời đại phân tán.', descriptionEn: 'A method for focused, distraction-free work that produces outsized results.' },
  { title: 'Getting Things Done', author: 'David Allen', publisher: 'Penguin Books', isbn13: '9780143126560', publicationYear: 2015, pageCount: 352, categorySlugs: ['productivity-learning'], priceVnd: 240000, descriptionVi: 'Hệ thống quản lý công việc và thời gian giúp giảm căng thẳng, tăng hiệu suất.', descriptionEn: 'A productivity system for managing tasks and time while reducing mental stress.' },
  { title: 'How to Win Friends and Influence People', author: 'Dale Carnegie', publisher: 'Simon & Schuster', isbn13: '9780671027032', publicationYear: 1998, pageCount: 291, categorySlugs: ['communication', 'psychology'], priceVnd: 200000, descriptionVi: 'Những nguyên tắc giao tiếp kinh điển giúp xây dựng mối quan hệ và gây ảnh hưởng tích cực.', descriptionEn: 'Classic communication principles for building relationships and positive influence.' },
  { title: 'Crucial Conversations', author: 'Kerry Patterson, Joseph Grenny, Ron McMillan, Al Switzler', publisher: 'McGraw-Hill', isbn13: '9780071771320', publicationYear: 2011, pageCount: 256, categorySlugs: ['communication', 'management-leadership'], priceVnd: 250000, descriptionVi: 'Kỹ năng xử lý các cuộc trò chuyện khó khăn với kết quả tích cực và bền vững.', descriptionEn: 'Skills for handling high-stakes conversations with positive, lasting outcomes.' },
  { title: 'Never Split the Difference', author: 'Chris Voss, Tahl Raz', publisher: 'Harper Business', isbn13: '9780062407801', publicationYear: 2016, pageCount: 288, categorySlugs: ['communication', 'business-economics'], priceVnd: 240000, descriptionVi: 'Kỹ thuật đàm phán từ cựu chuyên gia thương lượng con tin của FBI.', descriptionEn: 'Negotiation tactics from a former FBI hostage negotiation expert.' },
  { title: 'English Grammar in Use', author: 'Raymond Murphy', publisher: 'Cambridge University Press', isbn13: '9781108457651', publicationYear: 2019, pageCount: 380, categorySlugs: ['language-learning'], priceVnd: 280000, descriptionVi: 'Sách ngữ pháp tiếng Anh tự học phổ biến nhất thế giới với bài tập thực hành đa dạng.', descriptionEn: 'The world\u2019s most popular self-study English grammar book with varied practice exercises.' },
  { title: '504 Absolutely Essential Words', author: 'Murray Bromberg, Melvin Gordon', publisher: "Barron's Educational Series", isbn13: '9780764147814', publicationYear: 2013, pageCount: 442, categorySlugs: ['language-learning'], priceVnd: 200000, descriptionVi: 'Bộ từ vựng tiếng Anh thiết yếu được trình bày theo chủ đề để dễ học và ghi nhớ.', descriptionEn: 'Essential English vocabulary organized by theme for easier learning and retention.' },
  { title: 'Fluent Forever', author: 'Gabriel Wyner', publisher: 'Harmony', isbn13: '9780385348119', publicationYear: 2014, pageCount: 336, categorySlugs: ['language-learning'], priceVnd: 230000, descriptionVi: 'Phương pháp học ngoại ngữ hiệu quả dựa trên khoa học trí nhớ và ngữ âm.', descriptionEn: 'An effective language-learning method grounded in memory science and phonetics.' },
  { title: 'On Writing Well', author: 'William Zinsser', publisher: 'Harper Perennial', isbn13: '9780060891541', publicationYear: 2006, pageCount: 336, categorySlugs: ['education-skills', 'literature-arts'], priceVnd: 220000, descriptionVi: 'Hướng dẫn kinh điển về cách viết phi hư cấu rõ ràng, súc tích và hấp dẫn.', descriptionEn: 'A classic guide to writing clear, concise, and compelling nonfiction.' },
  { title: 'Bird by Bird', author: 'Anne Lamott', publisher: 'Anchor Books', isbn13: '9780385480017', publicationYear: 1995, pageCount: 256, categorySlugs: ['education-skills', 'literature-arts'], priceVnd: 200000, descriptionVi: 'Những lời khuyên chân thành và hài hước về nghệ thuật và đời sống của người viết.', descriptionEn: 'Honest, funny advice on the craft and life of being a writer.' },

  // ===================== More Programming / Tech (to reach ~100) =====================
  { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', publisher: 'No Starch Press', isbn13: '9781593279509', publicationYear: 2018, pageCount: 472, categorySlugs: ['programming'], priceVnd: 280000, descriptionVi: 'Giáo trình JavaScript hiện đại kết hợp lý thuyết với bài tập lập trình thực hành.', descriptionEn: 'A modern JavaScript textbook combining theory with hands-on coding exercises.' },
  { title: 'Head First Design Patterns', author: 'Eric Freeman, Elisabeth Robson', publisher: "O'Reilly Media", isbn13: '9781492078005', publicationYear: 2020, pageCount: 656, categorySlugs: ['programming', 'software-architecture'], priceVnd: 380000, descriptionVi: 'Giới thiệu mẫu thiết kế phần mềm theo cách trực quan, dễ hiểu và sinh động.', descriptionEn: 'An accessible, visual introduction to software design patterns.' },
  { title: 'Code Complete', author: 'Steve McConnell', publisher: 'Microsoft Press', isbn13: '9780735619678', publicationYear: 2004, pageCount: 960, categorySlugs: ['programming'], priceVnd: 420000, descriptionVi: 'Cẩm nang thực hành toàn diện về kỹ thuật xây dựng phần mềm chất lượng cao.', descriptionEn: 'A comprehensive practical handbook on constructing high-quality software.' },
  { title: 'Working Effectively with Legacy Code', author: 'Michael Feathers', publisher: 'Prentice Hall', isbn13: '9780131177055', publicationYear: 2004, pageCount: 456, categorySlugs: ['programming', 'software-architecture'], priceVnd: 360000, descriptionVi: 'Kỹ thuật làm việc an toàn với mã nguồn cũ không có test, giúp tái cấu trúc dần dần.', descriptionEn: 'Techniques for safely working with untested legacy code through gradual refactoring.' },
  { title: 'Continuous Delivery', author: 'Jez Humble, David Farley', publisher: 'Addison-Wesley', isbn13: '9780321601919', publicationYear: 2010, pageCount: 512, categorySlugs: ['devops-cloud', 'software-architecture'], priceVnd: 400000, descriptionVi: 'Phương pháp triển khai phần mềm tự động, an toàn và đáng tin cậy.', descriptionEn: 'A methodology for automated, safe, and reliable software deployment pipelines.' },
  { title: 'Cracking the Coding Interview', author: 'Gayle Laakmann McDowell', publisher: 'CareerCup', isbn13: '9780984782857', publicationYear: 2015, pageCount: 687, categorySlugs: ['programming', 'education-skills'], priceVnd: 350000, descriptionVi: 'Bộ câu hỏi và lời giải chi tiết giúp chuẩn bị cho các vòng phỏng vấn kỹ thuật.', descriptionEn: 'A detailed collection of questions and solutions to prepare for technical interviews.' },
  { title: 'The Mythical Man-Month', author: 'Frederick P. Brooks Jr.', publisher: 'Addison-Wesley', isbn13: '9780201835953', publicationYear: 1995, pageCount: 336, categorySlugs: ['software-architecture', 'management-leadership'], priceVnd: 300000, descriptionVi: 'Những bài học cổ điển về quản lý dự án phần mềm và lý do thêm người không luôn giúp nhanh hơn.', descriptionEn: 'Classic lessons on software project management and why adding people doesn\u2019t always speed things up.' },
  { title: 'Grokking Algorithms', author: 'Aditya Bhargava', publisher: 'Manning Publications', isbn13: '9781617292231', publicationYear: 2016, pageCount: 256, categorySlugs: ['programming', 'data-ai'], priceVnd: 260000, descriptionVi: 'Giải thích các thuật toán phổ biến bằng hình ảnh sinh động, dễ tiếp cận cho người mới.', descriptionEn: 'Explains common algorithms through friendly illustrations accessible to beginners.' },
  { title: 'Domain-Driven Design', author: 'Eric Evans', publisher: 'Addison-Wesley', isbn13: '9780321125217', publicationYear: 2003, pageCount: 560, categorySlugs: ['software-architecture'], priceVnd: 410000, descriptionVi: 'Phương pháp thiết kế phần mềm tập trung vào mô hình hóa miền nghiệp vụ phức tạp.', descriptionEn: 'A design methodology centered on modeling complex business domains effectively.' },
  { title: 'Accelerate', author: 'Nicole Forsgren, Jez Humble, Gene Kim', publisher: 'IT Revolution Press', isbn13: '9781942788331', publicationYear: 2018, pageCount: 288, categorySlugs: ['devops-cloud', 'management-leadership'], priceVnd: 320000, descriptionVi: 'Nghiên cứu dữ liệu chứng minh các thực hành kỹ thuật giúp tăng hiệu suất tổ chức.', descriptionEn: 'Data-driven research showing which technical practices drive organizational performance.' },

  // ===================== More Fiction / Literature to balance counts =====================
  { title: 'The Alchemist', author: 'Paulo Coelho', publisher: 'HarperOne', isbn13: '9780062315007', publicationYear: 2014, pageCount: 208, categorySlugs: ['fiction'], priceVnd: 150000, descriptionVi: 'Hành trình của một chàng trai trẻ theo đuổi vận mệnh và bài học về việc lắng nghe trái tim.', descriptionEn: 'A young shepherd\u2019s journey to find his destiny and learn to listen to his heart.' },
  { title: 'Animal Farm', author: 'George Orwell', publisher: 'Signet Classics', isbn13: '9780451526342', publicationYear: 1996, pageCount: 141, categorySlugs: ['fiction', 'social-issues'], priceVnd: 110000, descriptionVi: 'Ngụ ngôn chính trị châm biếm về cách quyền lực bị lạm dụng sau một cuộc cách mạng.', descriptionEn: 'A satirical political fable about power and corruption after a revolution.' },
  { title: 'The Kite Runner', author: 'Khaled Hosseini', publisher: 'Riverhead Books', isbn13: '9781594631931', publicationYear: 2004, pageCount: 372, categorySlugs: ['fiction'], priceVnd: 170000, descriptionVi: 'Câu chuyện cảm động về tình bạn, tội lỗi và sự chuộc lỗi tại Afghanistan.', descriptionEn: 'A moving story of friendship, guilt, and redemption set in Afghanistan.' },
  { title: 'Life of Pi', author: 'Yann Martel', publisher: 'Mariner Books', isbn13: '9780156027328', publicationYear: 2003, pageCount: 401, categorySlugs: ['fiction'], priceVnd: 170000, descriptionVi: 'Hành trình sinh tồn kỳ lạ của một chú bé trên biển cùng một con hổ Bengal.', descriptionEn: 'A boy\u2019s extraordinary survival journey across the ocean with a Bengal tiger.' },
  { title: 'The Road', author: 'Cormac McCarthy', publisher: 'Vintage Books', isbn13: '9780307387899', publicationYear: 2006, pageCount: 287, categorySlugs: ['fiction'], priceVnd: 160000, descriptionVi: 'Hành trình của một người cha và con trai qua thế giới hậu tận thế đầy tro tàn.', descriptionEn: 'A father and son\u2019s journey through a bleak, ash-covered post-apocalyptic world.' },
  { title: 'Fahrenheit 451', author: 'Ray Bradbury', publisher: 'Simon & Schuster', isbn13: '9781451673319', publicationYear: 2012, pageCount: 256, categorySlugs: ['fiction'], priceVnd: 150000, descriptionVi: 'Một xã hội tương lai nơi sách bị cấm và đốt cháy để duy trì sự ổn định giả tạo.', descriptionEn: 'A future society where books are banned and burned to maintain false stability.' },
  { title: 'Slaughterhouse-Five', author: 'Kurt Vonnegut', publisher: 'Dial Press', isbn13: '9780385333849', publicationYear: 1991, pageCount: 275, categorySlugs: ['fiction'], priceVnd: 150000, descriptionVi: 'Tiểu thuyết phi tuyến tính kết hợp chiến tranh, thời gian và yếu tố khoa học viễn tưởng.', descriptionEn: 'A nonlinear novel blending war, time travel, and science fiction elements.' },
  { title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', publisher: 'Penguin Classics', isbn13: '9780141439570', publicationYear: 2003, pageCount: 254, categorySlugs: ['fiction', 'literature-arts'], priceVnd: 140000, descriptionVi: 'Câu chuyện gothic về cái đẹp, sự suy đồi đạo đức và cái giá của ham muốn vĩnh cửu.', descriptionEn: 'A gothic tale of beauty, moral decay, and the cost of eternal vanity.' },
  { title: 'Frankenstein', author: 'Mary Shelley', publisher: 'Penguin Classics', isbn13: '9780141439471', publicationYear: 2003, pageCount: 273, categorySlugs: ['fiction'], priceVnd: 140000, descriptionVi: 'Tiểu thuyết khoa học viễn tưởng kinh điển về một nhà khoa học và sinh vật ông tạo ra.', descriptionEn: 'The classic science fiction novel about a scientist and the creature he creates.' },
  { title: 'Dracula', author: 'Bram Stoker', publisher: 'Penguin Classics', isbn13: '9780141439846', publicationYear: 2003, pageCount: 454, categorySlugs: ['fiction'], priceVnd: 160000, descriptionVi: 'Tiểu thuyết kinh dị Gothic kinh điển kể về cuộc đối đầu với bá tước ma cà rồng.', descriptionEn: 'The classic Gothic horror novel chronicling a confrontation with the vampire count.' },

  // ===================== More children/YA & short stories to balance =====================
  { title: 'Where the Wild Things Are', author: 'Maurice Sendak', publisher: 'HarperCollins', isbn13: '9780064431781', publicationYear: 1991, pageCount: 48, categorySlugs: ['children-ya'], priceVnd: 90000, descriptionVi: 'Cuộc phiêu lưu kỳ thú của Max đến vùng đất của những con vật hoang dã trong tưởng tượng.', descriptionEn: 'Max\u2019s imaginative adventure to the land of wild, fantastical creatures.' },
  { title: 'The Very Hungry Caterpillar', author: 'Eric Carle', publisher: 'World of Eric Carle', isbn13: '9780399226908', publicationYear: 1994, pageCount: 26, categorySlugs: ['children-ya'], priceVnd: 90000, descriptionVi: 'Câu chuyện minh họa sinh động về hành trình biến hình của một chú sâu nhỏ.', descriptionEn: 'A vividly illustrated story of a little caterpillar\u2019s transformation.' },
  { title: 'Goodnight Moon', author: 'Margaret Wise Brown', publisher: 'HarperFestival', isbn13: '9780064430173', publicationYear: 1991, pageCount: 32, categorySlugs: ['children-ya'], priceVnd: 80000, descriptionVi: 'Cuốn sách ru ngủ kinh điển với vần điệu nhẹ nhàng cho trẻ trước giờ đi ngủ.', descriptionEn: 'A classic bedtime book with gentle, soothing rhymes for young children.' },
  { title: 'Charlie and the Chocolate Factory', author: 'Roald Dahl', publisher: 'Puffin Books', isbn13: '9780142410318', publicationYear: 2007, pageCount: 176, categorySlugs: ['children-ya'], priceVnd: 130000, descriptionVi: 'Hành trình kỳ diệu của Charlie vào nhà máy sô-cô-la huyền bí của ông Willy Wonka.', descriptionEn: 'Charlie\u2019s magical journey through Willy Wonka\u2019s mysterious chocolate factory.' },
  { title: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum', publisher: 'HarperCollins', isbn13: '9780688166779', publicationYear: 2000, pageCount: 259, categorySlugs: ['children-ya', 'fiction'], priceVnd: 130000, descriptionVi: 'Hành trình của Dorothy qua vùng đất Oz kỳ diệu để tìm đường về nhà.', descriptionEn: "Dorothy\u2019s journey through the magical land of Oz to find her way home." },
  { title: 'Interpreter of Maladies', author: 'Jhumpa Lahiri', publisher: 'Houghton Mifflin', isbn13: '9780395927205', publicationYear: 1999, pageCount: 198, categorySlugs: ['short-stories', 'literature-arts'], priceVnd: 150000, descriptionVi: 'Tuyển tập truyện ngắn về những người Ấn Độ và Mỹ gốc Ấn giữa hai nền văn hóa.', descriptionEn: 'Short stories about Indian and Indian-American lives caught between two cultures.' },
  { title: 'A Good Man Is Hard to Find', author: 'Flannery O\u2019Connor', publisher: 'Harvest Books', isbn13: '9780156364652', publicationYear: 1977, pageCount: 251, categorySlugs: ['short-stories'], priceVnd: 140000, descriptionVi: 'Tuyển tập truyện ngắn nổi tiếng với phong cách Gothic miền Nam đầy ám ảnh.', descriptionEn: 'A celebrated short story collection in the haunting Southern Gothic tradition.' },

  // ===================== Additional Business/Finance/Mgmt to round to ~100 =====================
  { title: 'Start with Why', author: 'Simon Sinek', publisher: 'Portfolio', isbn13: '9781591846444', publicationYear: 2011, pageCount: 256, categorySlugs: ['management-leadership', 'marketing-sales'], priceVnd: 230000, descriptionVi: 'Lý do những tổ chức vĩ đại bắt đầu bằng câu hỏi "tại sao" trước khi hành động.', descriptionEn: 'Why great organizations start with the question "why" before taking action.' },
  { title: 'The E-Myth Revisited', author: 'Michael E. Gerber', publisher: 'Harper Business', isbn13: '9780887307287', publicationYear: 1995, pageCount: 288, categorySlugs: ['entrepreneurship', 'business-economics'], priceVnd: 220000, descriptionVi: 'Lý do hầu hết doanh nghiệp nhỏ thất bại và cách xây dựng hệ thống kinh doanh bền vững.', descriptionEn: 'Why most small businesses fail and how to build a systemized, sustainable business.' },
  { title: 'Built to Last', author: 'Jim Collins, Jerry I. Porras', publisher: 'Harper Business', isbn13: '9780060516406', publicationYear: 2004, pageCount: 368, categorySlugs: ['business-economics', 'management-leadership'], priceVnd: 270000, descriptionVi: 'Nghiên cứu về những đặc điểm chung của các công ty thành công lâu dài.', descriptionEn: 'A study of the shared traits behind enduring, visionary companies.' },
  { title: 'The Innovator\u2019s Solution', author: 'Clayton M. Christensen, Michael E. Raynor', publisher: 'Harvard Business Review Press', isbn13: '9781422196571', publicationYear: 2013, pageCount: 320, categorySlugs: ['business-economics', 'entrepreneurship'], priceVnd: 290000, descriptionVi: 'Hướng dẫn ứng dụng lý thuyết đổi mới gián đoạn để tăng trưởng doanh nghiệp.', descriptionEn: 'A guide to applying disruptive innovation theory to drive business growth.' },
  { title: 'Freakonomics', author: 'Steven D. Levitt, Stephen J. Dubner', publisher: 'William Morrow', isbn13: '9780060731328', publicationYear: 2009, pageCount: 320, categorySlugs: ['business-economics', 'social-issues'], priceVnd: 230000, descriptionVi: 'Khám phá những góc nhìn kinh tế học bất ngờ ẩn sau các hiện tượng đời thường.', descriptionEn: 'Surprising economic perspectives hidden behind everyday phenomena.' },

  // ===================== Productivity / Self-help extras =====================
  { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', publisher: 'Free Press', isbn13: '9780743269513', publicationYear: 2004, pageCount: 432, categorySlugs: ['psychology', 'productivity-learning'], priceVnd: 250000, descriptionVi: 'Bảy nguyên tắc nền tảng giúp xây dựng hiệu quả cá nhân và sự nghiệp bền vững.', descriptionEn: 'Seven foundational principles for building lasting personal and career effectiveness.' },
  { title: 'Daring Greatly', author: 'Brené Brown', publisher: 'Avery', isbn13: '9781592408412', publicationYear: 2015, pageCount: 320, categorySlugs: ['psychology'], priceVnd: 230000, descriptionVi: 'Khám phá sức mạnh của sự tổn thương và lòng can đảm trong cuộc sống và công việc.', descriptionEn: 'Exploring the power of vulnerability and courage in life and work.' },
  { title: 'Grit', author: 'Angela Duckworth', publisher: 'Scribner', isbn13: '9781501111105', publicationYear: 2016, pageCount: 352, categorySlugs: ['psychology', 'productivity-learning'], priceVnd: 230000, descriptionVi: 'Nghiên cứu về vai trò của sự bền bỉ và đam mê trong thành công dài hạn.', descriptionEn: 'Research into the role of perseverance and passion in long-term success.' },
  { title: 'The Power of Habit', author: 'Charles Duhigg', publisher: 'Random House', isbn13: '9780812981605', publicationYear: 2014, pageCount: 416, categorySlugs: ['psychology', 'productivity-learning'], priceVnd: 240000, descriptionVi: 'Khoa học đằng sau cách thói quen hình thành và cách thay đổi chúng hiệu quả.', descriptionEn: 'The science behind how habits form and how to effectively change them.' },
  { title: 'Quiet: The Power of Introverts', author: 'Susan Cain', publisher: 'Broadway Books', isbn13: '9780307352156', publicationYear: 2013, pageCount: 368, categorySlugs: ['psychology'], priceVnd: 230000, descriptionVi: 'Khám phá giá trị và sức mạnh thầm lặng của những người hướng nội trong xã hội ồn ào.', descriptionEn: 'Exploring the quiet strength and value of introverts in an extroverted world.' },
];


// =============================================================================
// 6. Upsert authors / publishers / books / variants / snapshots
// =============================================================================

type SeededBookVariant = {
  id: number;
  bookId: number;
  format: BookFormat;
  price: number;
  isbn: string | null;
};

type SeededBookVariantSnapshot = {
  id: number;
  bookVariantId: number;
  bookId: number;
  priceSnapshot: number;
  formatSnapshot: BookFormat;
};

async function upsertAuthorByName(defaultName: string) {
  const existing = await prisma.author.findFirst({
    where: { defaultName },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.author.create({ data: { defaultName }, select: { id: true } });
  return created.id;
}

async function upsertPublisherByName(defaultName: string) {
  const existing = await prisma.publisher.findFirst({
    where: { defaultName },
    select: { id: true },
  });
  if (existing) return existing.id;
  const created = await prisma.publisher.create({ data: { defaultName }, select: { id: true } });
  return created.id;
}

/**
 * Quyết định các BookFormat sẽ tạo cho một cuốn sách dựa trên index,
 * để đa dạng hoá định dạng (không phải cuốn nào cũng có đủ 4 format).
 */
function resolveFormatsForBook(index: number): BookFormat[] {
  const mod = index % 4;
  if (mod === 0) return [BookFormat.PAPERBACK, BookFormat.HARDCOVER, BookFormat.EBOOK];
  if (mod === 1) return [BookFormat.PAPERBACK, BookFormat.EBOOK];
  if (mod === 2) return [BookFormat.PAPERBACK, BookFormat.HARDCOVER, BookFormat.EBOOK, BookFormat.AUDIOBOOK];
  return [BookFormat.PAPERBACK];
}

function pickBadgeForBook(index: number): Badge | null {
  const mod = index % 9;
  if (mod === 0) return Badge.BESTSELLER;
  if (mod === 3) return Badge.NEW;
  if (mod === 5) return Badge.EDITION;
  if (mod === 7) return Badge.LIMITED;
  return null;
}

async function upsertCatalogBooks(
  languageIdByCode: Map<string, number>,
  categoryIdBySlug: Map<string, number>,
  supplierIdByCode: Map<string, number>,
) {
  const viLanguageId = languageIdByCode.get('vi');
  const enLanguageId = languageIdByCode.get('en');
  if (!viLanguageId || !enLanguageId) {
    throw new Error('Missing vi/en language seed');
  }

  const supplierIds = [...supplierIdByCode.values()];
  const seededVariants: SeededBookVariant[] = [];
  const bookIds: number[] = [];

  for (let i = 0; i < REAL_BOOKS.length; i += 1) {
    const book = REAL_BOOKS[i];
    const slug = `${slugify(book.title)}-${book.isbn13.slice(-4)}`;

    const authorId = await upsertAuthorByName(book.author);
    const publisherId = await upsertPublisherByName(book.publisher);

    const existingTranslation = await prisma.bookTranslation.findFirst({
      where: { languageId: enLanguageId, slug },
      select: { bookId: true },
    });

    const coverImageUrl = `https://picsum.photos/seed/book-${book.isbn13}/720/1080`;
    const weightGrams = 260 + Math.round(book.pageCount * 1.6);

    let bookId: number;
    if (existingTranslation) {
      bookId = existingTranslation.bookId;
      await prisma.book.update({
        where: { id: bookId },
        data: {
          publisherId,
          publicationYear: book.publicationYear,
          pageCount: book.pageCount,
          weightGrams,
          coverImageUrl,
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
          weightGrams,
          coverImageUrl,
          isActive: true,
        },
        select: { id: true },
      });
      bookId = created.id;
    }
    bookIds.push(bookId);

    // Bản dịch EN (gốc) + VI
    await prisma.bookTranslation.upsert({
      where: { bookId_languageId: { bookId, languageId: enLanguageId } },
      update: { title: book.title, description: book.descriptionEn, slug },
      create: { bookId, languageId: enLanguageId, title: book.title, description: book.descriptionEn, slug },
    });

    await prisma.bookTranslation.upsert({
      where: { bookId_languageId: { bookId, languageId: viLanguageId } },
      update: { title: book.title, description: book.descriptionVi, slug },
      create: { bookId, languageId: viLanguageId, title: book.title, description: book.descriptionVi, slug },
    });

    // Tác giả (primary)
    await prisma.bookAuthor.upsert({
      where: { bookId_authorId: { bookId, authorId } },
      update: { isPrimary: true },
      create: { bookId, authorId, isPrimary: true },
    });

    // Category mapping
    await prisma.bookCategory.deleteMany({ where: { bookId } });
    const categoryIds = book.categorySlugs
      .map((slug2) => categoryIdBySlug.get(slug2))
      .filter((id): id is number => Boolean(id));
    if (categoryIds.length) {
      await prisma.bookCategory.createMany({
        data: categoryIds.map((categoryId) => ({ bookId, categoryId })),
        skipDuplicates: true,
      });
    }

    // Specs (kích thước ước lượng theo format sách giấy phổ biến)
    await prisma.bookSpec.upsert({
      where: { bookId },
      update: {
        widthCm: 14,
        heightCm: 20.5,
        thicknessCm: Math.max(0.6, Math.round((book.pageCount / 350) * 100) / 100),
        packaging: 'Bọc màng co tiêu chuẩn',
      },
      create: {
        bookId,
        widthCm: 14,
        heightCm: 20.5,
        thicknessCm: Math.max(0.6, Math.round((book.pageCount / 350) * 100) / 100),
        packaging: 'Bọc màng co tiêu chuẩn',
      },
    });

    // Badge (không phải sách nào cũng có)
    const badgeCode = pickBadgeForBook(i);
    if (badgeCode) {
      await prisma.bookBadge.upsert({
        where: { bookId },
        update: { code: badgeCode },
        create: { bookId, code: badgeCode },
      });
    }

    // Cover asset
    await prisma.bookVariantAsset.deleteMany({ where: { bookId, assetType: 'COVER' } });
    await prisma.bookVariantAsset.create({
      data: { bookId, url: coverImageUrl, assetType: 'COVER', sortOrder: 0 },
    });

    // Variants theo định dạng
    const formats = resolveFormatsForBook(i);
    for (let v = 0; v < formats.length; v += 1) {
      const format = formats[v];
      const edition = 1;
      const isEbookOrAudio = format === BookFormat.EBOOK || format === BookFormat.AUDIOBOOK;

      const multiplier = format === BookFormat.HARDCOVER ? 1.35 : format === BookFormat.AUDIOBOOK ? 1.1 : format === BookFormat.EBOOK ? 0.65 : 1;
      const price = toRoundedVnd(book.priceVnd * multiplier);
      const costPrice = toRoundedVnd(price * 0.62);
      const stock = isEbookOrAudio ? randomInt(500, 5000) : randomInt(20, 200);
      const supplierId = isEbookOrAudio ? null : randomOne(supplierIds);

      // ISBN thật chỉ gắn cho variant đầu tiên (PAPERBACK gốc); các format khác
      // dùng biến thể của ISBN gốc để tránh đụng @unique nhưng vẫn rõ nguồn gốc.
      const isbn = v === 0 ? book.isbn13 : `${book.isbn13.slice(0, 12)}${(Number(book.isbn13.slice(12)) + v) % 10}`;

      const variantRow = await prisma.bookVariant.upsert({
        where: { bookId_format_edition: { bookId, format, edition } },
        update: {
          isbn,
          costPrice,
          price,
          currencyCode: CURRENCY_CODE_VND,
          stock,
          available: stock,
          isActive: true,
          supplierId,
        },
        create: {
          bookId,
          format,
          edition,
          isbn,
          costPrice,
          price,
          currencyCode: CURRENCY_CODE_VND,
          stock,
          available: stock,
          reserved: 0,
          isActive: true,
          supplierId,
        },
        select: { id: true, bookId: true, format: true, price: true, isbn: true },
      });

      seededVariants.push({
        id: variantRow.id,
        bookId: variantRow.bookId,
        format: variantRow.format,
        price: Number(variantRow.price),
        isbn: variantRow.isbn,
      });
    }
  }

  return { bookIds, variants: seededVariants };
}

async function upsertVariantSnapshots(variants: SeededBookVariant[]) {
  const snapshots: SeededBookVariantSnapshot[] = [];

  for (const variant of variants) {
    const contentHash = `seed-snap-${variant.id}`;
    const existing = await prisma.bookVariantSnapshot.findUnique({
      where: { contentHash },
      select: { id: true },
    });

    const data = {
      bookVariantId: variant.id,
      contentHash,
      priceSnapshot: variant.price,
      currencyCodeSnapshot: CURRENCY_CODE_VND,
      formatSnapshot: variant.format,
      isbnSnapshot: variant.isbn,
    };

    const row = existing
      ? await prisma.bookVariantSnapshot.update({
        where: { id: existing.id },
        data,
        select: { id: true, bookVariantId: true, priceSnapshot: true, formatSnapshot: true },
      })
      : await prisma.bookVariantSnapshot.create({
        data,
        select: { id: true, bookVariantId: true, priceSnapshot: true, formatSnapshot: true },
      });

    snapshots.push({
      id: row.id,
      bookVariantId: row.bookVariantId,
      bookId: variant.bookId,
      priceSnapshot: Number(row.priceSnapshot),
      formatSnapshot: row.formatSnapshot,
    });
  }

  return snapshots;
}

// =============================================================================
// 7. Users (cố định + customer) — MỖI customer có NHIỀU địa chỉ (UserAddress)
// =============================================================================

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

type SeededUser = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
};

const FIRST_NAMES = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vu', 'Do', 'Dang', 'Bui', 'Phan'];
const LAST_NAMES = [
  'An', 'Binh', 'Chi', 'Dung', 'Giang', 'Hanh', 'Khanh', 'Linh', 'Minh', 'Nam',
  'Phuong', 'Quang', 'Thao', 'Trang', 'Vy',
];

const ADDRESS_POOL = [
  { city: 'Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé' },
  { city: 'Hồ Chí Minh', district: 'Quận 3', ward: 'Võ Thị Sáu' },
  { city: 'Hồ Chí Minh', district: 'Quận 7', ward: 'Tân Phong' },
  { city: 'Hồ Chí Minh', district: 'Thành phố Thủ Đức', ward: 'An Phú' },
  { city: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng' },
  { city: 'Hà Nội', district: 'Thanh Xuân', ward: 'Khương Trung' },
  { city: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'Hàng Bạc' },
  { city: 'Đà Nẵng', district: 'Hải Châu', ward: 'Hòa Cường' },
  { city: 'Đà Nẵng', district: 'Sơn Trà', ward: 'An Hải Bắc' },
  { city: 'Cần Thơ', district: 'Ninh Kiều', ward: 'An Hòa' },
  { city: 'Hải Phòng', district: 'Lê Chân', ward: 'An Biên' },
  { city: 'Nha Trang', district: 'Nha Trang', ward: 'Vĩnh Hải' },
];

const ADDRESS_TYPES = ['HOME', 'OFFICE'];


/**
 * Tạo cho user N địa chỉ (2-4), địa chỉ đầu tiên isDefault = true.
 */
async function seedAddressesForUser(user: SeededUser) {
  await prisma.userAddress.deleteMany({ where: { userId: user.id } });

  const addressCount = randomInt(2, 4);
  const chosen = takeRandomUnique(ADDRESS_POOL, addressCount);
  const fullName = `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim() || 'Khách hàng';

  for (let i = 0; i < chosen.length; i += 1) {
    const loc = chosen[i];
    await prisma.userAddress.create({
      data: {
        userId: user.id,
        addressType: randomOne(ADDRESS_TYPES),
        recipientName: fullName,
        phoneNumber: user.phoneNumber ?? `09${randomInt(10000000, 99999999)}`,
        addressDetail: `Số ${randomInt(1, 320)} đường ${randomOne(['Lê Lợi', 'Nguyễn Huệ', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Pasteur', 'Cách Mạng Tháng 8'])}`,
        ward: loc.ward,
        district: loc.district,
        city: loc.city,
        isDefault: i === 0,
      },
    });
  }
}

function buildCustomerSeedUsers(): SeedUser[] {
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

async function seedUsers(roleIdByCode: Map<RoleCode, number>) {
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

  const seededFixed: SeededUser[] = [];
  for (const user of fixedUsers) {
    const u = await upsertUserWithRoles(user, roleIdByCode);
    seededFixed.push(u);
    console.log(`Seeded user: ${u.email}`);
  }

  const customerUsers = buildCustomerSeedUsers();
  const seededCustomers: SeededUser[] = [];
  for (const user of customerUsers) {
    const u = await upsertUserWithRoles(user, roleIdByCode);
    seededCustomers.push(u);
  }

  // Mỗi user (cả fixed admin/staff/warehouse/guest1 và customer) đều có nhiều địa chỉ
  for (const u of [...seededFixed, ...seededCustomers]) {
    await seedAddressesForUser(u);
  }

  console.log(`Seeded customers: ${seededCustomers.length}`);
  console.log(`Seeded total users: ${seededFixed.length + seededCustomers.length}`);

  return { fixedUsers: seededFixed, customers: seededCustomers };
}

// =============================================================================
// 8. Guest sessions (khách không đăng nhập) — mỗi guest cũng có thể có nhiều
//    "địa chỉ" thông qua nhiều OrderAddress khác nhau trên các order của họ.
// =============================================================================

type SeededGuestSession = { id: string; email: string };

const GUEST_COUNT = 15;

async function seedGuestSessions(): Promise<SeededGuestSession[]> {
  const guests: SeededGuestSession[] = [];

  for (let i = 1; i <= GUEST_COUNT; i += 1) {
    const email = `guest-visitor${i}@example.com`;
    const existing = await prisma.guestSession.findFirst({
      where: { userAgentHash: `seed-guest-hash-${i}` },
      select: { id: true },
    });

    const row = existing
      ? await prisma.guestSession.update({
        where: { id: existing.id },
        data: { lastSeenAt: randomDateWithinDays(30) },
        select: { id: true },
      })
      : await prisma.guestSession.create({
        data: {
          ipFirst: `203.113.${randomInt(1, 254)}.${randomInt(1, 254)}`,
          userAgentHash: `seed-guest-hash-${i}`,
          lastSeenAt: randomDateWithinDays(30),
        },
        select: { id: true },
      });

    guests.push({ id: row.id, email });
  }

  console.log(`Seeded guest sessions: ${guests.length}`);
  return guests;
}

// =============================================================================
// 9. Demo orders (Order / OrderItem / OrderAddress / PaymentTransaction)
//    cho cả user đã đăng nhập và guest.
// =============================================================================

function resolveOrderState() {
  const roll = Math.random() * 100;
  if (roll < 8) return { status: OrderStatus.PENDING_PAYMENT, paymentStatus: PaymentStatus.PENDING };
  if (roll < 14) return { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.FAILED };
  if (roll < 24) return { status: OrderStatus.PAID, paymentStatus: PaymentStatus.SUCCESS };
  if (roll < 36) return { status: OrderStatus.CONFIRMED, paymentStatus: PaymentStatus.SUCCESS };
  if (roll < 52) return { status: OrderStatus.PACKING, paymentStatus: PaymentStatus.SUCCESS };
  if (roll < 70) return { status: OrderStatus.SHIPPING, paymentStatus: PaymentStatus.SUCCESS };
  return { status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.SUCCESS };
}

function randomDiscountRate() {
  return randomOne([0, 0, 0.05, 0.1, 0.1, 0.15, 0.2]);
}

async function clearPreviousSeedOrders() {
  await prisma.order.deleteMany({ where: { orderCode: { startsWith: ORDER_CODE_PREFIX } } });
}

async function seedOrdersForUsers(
  customers: SeededUser[],
  snapshots: SeededBookVariantSnapshot[],
) {
  if (!customers.length || !snapshots.length) return;

  for (let index = 1; index <= USER_ORDER_COUNT; index += 1) {
    const customer = randomOne(customers);
    const orderSnapshots = takeRandomUnique(snapshots, randomInt(1, 4));
    if (!orderSnapshots.length) continue;

    const state = resolveOrderState();

    const items = orderSnapshots.map((snapshot) => {
      const quantity = randomInt(1, 3);
      const discountRate = randomDiscountRate();
      const unitPrice = toRoundedVnd(snapshot.priceSnapshot * (1 - discountRate));
      const lineTotal = unitPrice * quantity;
      return { snapshot, quantity, unitPrice, lineTotal };
    });

    const subtotal = items.reduce((sum, it) => sum + it.snapshot.priceSnapshot * it.quantity, 0);
    const discountedSubtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
    const discountAmount = Math.max(0, toRoundedVnd(subtotal) - discountedSubtotal);
    const hasPhysical = items.some(
      (it) => it.snapshot.formatSnapshot === BookFormat.HARDCOVER || it.snapshot.formatSnapshot === BookFormat.PAPERBACK,
    );
    const shippingFee = hasPhysical ? randomOne([0, 15000, 20000, 25000, 30000]) : 0;
    const totalAmount = discountedSubtotal + shippingFee;

    const orderCode = `${ORDER_CODE_PREFIX}U-${index.toString().padStart(4, '0')}`;
    const placedAt = randomDateWithinDays(120);
    const expiredAt = new Date(placedAt.getTime() + ORDER_EXPIRED_SECONDS * 1000);

    const order = await prisma.order.create({
      data: {
        orderCode,
        userId: customer.id,
        status: state.status,
        paymentStatus: state.paymentStatus,
        subtotal: toRoundedVnd(subtotal),
        discountAmount,
        shippingFee,
        totalAmount,
        currencyCode: CURRENCY_CODE_VND,
        idempotencyKey: `seed-user-order-${index}`,
        placedAt,
        expiredAt,
        createdBy: customer.id,
      },
      select: { id: true },
    });

    const location = randomOne(ADDRESS_POOL);
    const fullName = `${customer.lastName ?? ''} ${customer.firstName ?? ''}`.trim() || 'Khách hàng';
    await prisma.orderAddress.create({
      data: {
        orderId: order.id,
        recipientName: fullName,
        phoneNumber: customer.phoneNumber ?? '0900000000',
        addressLine: `Số ${randomInt(1, 300)} đường Seed`,
        ward: location.ward,
        district: location.district,
        city: location.city,
        countryCode: 'VN',
        note: 'Đơn hàng demo (seed)',
      },
    });

    await prisma.orderItem.createMany({
      data: items.map((it) => ({
        orderId: order.id,
        bookVariantSnapshotId: it.snapshot.id,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      })),
    });

    const gateway = randomOne([PaymentGateway.COD, PaymentGateway.VNPAY, PaymentGateway.MOMO]);
    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        userId: customer.id,
        gateway,
        status: state.paymentStatus,
        amount: totalAmount,
        currencyCode: CURRENCY_CODE_VND,
        referenceNumber: `SEED-TXN-U-${index.toString().padStart(4, '0')}`,
        requestId: `SEED-REQ-U-${index.toString().padStart(4, '0')}`,
        idempotencyKey: `seed-user-payment-${index}`,
      },
    });
  }

  console.log(`Seeded user orders: ${USER_ORDER_COUNT}`);
}

async function seedOrdersForGuests(
  guests: SeededGuestSession[],
  snapshots: SeededBookVariantSnapshot[],
) {
  if (!guests.length || !snapshots.length) return;

  for (let index = 1; index <= GUEST_ORDER_COUNT; index += 1) {
    const guest = randomOne(guests);
    const orderSnapshots = takeRandomUnique(snapshots, randomInt(1, 3));
    if (!orderSnapshots.length) continue;

    const state = resolveOrderState();

    const items = orderSnapshots.map((snapshot) => {
      const quantity = randomInt(1, 2);
      const discountRate = randomDiscountRate();
      const unitPrice = toRoundedVnd(snapshot.priceSnapshot * (1 - discountRate));
      const lineTotal = unitPrice * quantity;
      return { snapshot, quantity, unitPrice, lineTotal };
    });

    const subtotal = items.reduce((sum, it) => sum + it.snapshot.priceSnapshot * it.quantity, 0);
    const discountedSubtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);
    const discountAmount = Math.max(0, toRoundedVnd(subtotal) - discountedSubtotal);
    const shippingFee = randomOne([0, 15000, 20000, 25000]);
    const totalAmount = discountedSubtotal + shippingFee;

    const orderCode = `${ORDER_CODE_PREFIX}G-${index.toString().padStart(4, '0')}`;
    const placedAt = randomDateWithinDays(120);
    const expiredAt = new Date(placedAt.getTime() + ORDER_EXPIRED_SECONDS * 1000);
    const location = randomOne(ADDRESS_POOL);
    const guestPhone = `08${randomInt(10000000, 99999999)}`;
    const guestName = `Khach ${randomOne(FIRST_NAMES)} ${randomOne(LAST_NAMES)}`;

    const order = await prisma.order.create({
      data: {
        orderCode,
        guestSessionId: guest.id,
        guestEmail: guest.email,
        status: state.status,
        paymentStatus: state.paymentStatus,
        subtotal: toRoundedVnd(subtotal),
        discountAmount,
        shippingFee,
        totalAmount,
        currencyCode: CURRENCY_CODE_VND,
        idempotencyKey: `seed-guest-order-${index}`,
        placedAt,
        expiredAt,
      },
      select: { id: true },
    });

    await prisma.orderAddress.create({
      data: {
        orderId: order.id,
        recipientName: guestName,
        phoneNumber: guestPhone,
        addressLine: `Số ${randomInt(1, 300)} đường Khách vãng lai`,
        ward: location.ward,
        district: location.district,
        city: location.city,
        countryCode: 'VN',
        note: 'Đơn hàng khách vãng lai (seed)',
      },
    });

    await prisma.orderItem.createMany({
      data: items.map((it) => ({
        orderId: order.id,
        bookVariantSnapshotId: it.snapshot.id,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
      })),
    });

    const gateway = randomOne([PaymentGateway.COD, PaymentGateway.MOMO, PaymentGateway.VNPAY]);
    await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        gateway,
        status: state.paymentStatus,
        amount: totalAmount,
        currencyCode: CURRENCY_CODE_VND,
        referenceNumber: `SEED-TXN-G-${index.toString().padStart(4, '0')}`,
        requestId: `SEED-REQ-G-${index.toString().padStart(4, '0')}`,
        idempotencyKey: `seed-guest-payment-${index}`,
      },
    });
  }

  console.log(`Seeded guest orders: ${GUEST_ORDER_COUNT}`);
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('--- Seeding base data (languages, roles, suppliers, categories) ---');
  const languageIdByCode = await upsertLanguages();
  const roleIdByCode = await upsertRoles();
  const supplierIdByCode = await upsertSuppliers();
  const categoryIdBySlug = await upsertCategories(languageIdByCode);
  await upsertPermissions();
  console.log('--- Seeding users (with multiple addresses) ---');
  const { customers } = await seedUsers(roleIdByCode);

  console.log('--- Seeding guest sessions ---');
  const guests = await seedGuestSessions();

  console.log('--- Seeding catalog: ~100 real books with real ISBNs ---');
  try {
    const { bookIds, variants } = await upsertCatalogBooks(languageIdByCode, categoryIdBySlug, supplierIdByCode);
    const snapshots = await upsertVariantSnapshots(variants);

    console.log(`Seeded books: ${bookIds.length}`);
    console.log(`Seeded variants: ${variants.length}`);
    console.log(`Seeded variant snapshots: ${snapshots.length}`);

    console.log('--- Seeding demo orders (users + guests) ---');
    await clearPreviousSeedOrders();
    await seedOrdersForUsers(customers, snapshots);
    await seedOrdersForGuests(guests, snapshots);
  } catch (error: any) {
    if (error?.code === 'P2021') {
      console.warn('[seed] Skip catalog demo seed: required catalog tables are missing in current database.');
      console.warn('[seed] Run migrations first, e.g. `npx prisma migrate dev` or `npx prisma db push`, then seed again.');
      return;
    }
    throw error;
  }

  console.log('--- Seed completed successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });