// // prisma/seed.ts
// //
// // Seed dữ liệu thật cho bookstore:
// // - Roles + Permissions + RolePermissions theo RBAC hiện tại
// // - Users: admin/staff/warehouse/customer, KHÔNG tạo guest user
// // - Languages vi/en, categories đa cấp có bản dịch
// // - 20+ suppliers
// // - 200 books có bản dịch vi/en, author, publisher, category, specs, cover asset
// // - Book variants đa dạng: có sách 1 variant, có sách nhiều variant
// // - Book inactive => variant inactive, costPrice = null, price = null, stock = 0
// // - Active stock đa dạng: 10, 20, 50, 100, 150, 200...
// //
// // Chạy:
// //   npx tsx prisma/seed.ts
// // hoặc:
// //   npx prisma db seed

// import { PermissionCode } from '@/common/constants/permission-pattern.constant';
// import { PrismaMariaDb } from '@prisma/adapter-mariadb';
// import {
//     AddressType,
//     Badge,
//     BookFormat,
//     CurrencyCode,
//     HTTPMethod,
//     PrismaClient,
//     RoleCode,
//     UserStatus,
// } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const connectionConfig: any =
//     process.env.DATABASE_URL ??
//     ({
//         host: process.env.DB_HOST ?? 'localhost',
//         port: Number(process.env.DB_PORT ?? 3308),
//         user: process.env.DB_USERNAME ?? 'root',
//         password: process.env.DB_PASSWORD ?? 'huy123',
//         database: process.env.DB_NAME ?? 'book_store',
//         connectionLimit: 5,
//     } as const);

// const adapter = new PrismaMariaDb(connectionConfig);
// const prisma = new PrismaClient({ adapter });

// // =============================================================================
// // Helpers
// // =============================================================================

// function randomInt(min: number, max: number) {
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// function randomOne<T>(items: T[]): T {
//     return items[randomInt(0, items.length - 1)];
// }

// function shuffle<T>(items: T[]) {
//     const copy = [...items];
//     for (let i = copy.length - 1; i > 0; i -= 1) {
//         const j = randomInt(0, i);
//         [copy[i], copy[j]] = [copy[j], copy[i]];
//     }
//     return copy;
// }

// function takeRandomUnique<T>(items: T[], take: number) {
//     return shuffle(items).slice(0, Math.max(0, Math.min(take, items.length)));
// }

// function toRoundedVnd(value: number) {
//     return Math.max(1000, Math.round(value / 1000) * 1000);
// }

// function slugify(input: string) {
//     return input
//         .toLowerCase()
//         .normalize('NFD')
//         .replace(/[\u0300-\u036f]/g, '')
//         .replace(/đ/g, 'd')
//         .replace(/[^a-z0-9]+/g, '-')
//         .replace(/^-+|-+$/g, '');
// }

// function isbn13FromSeed(seed: number) {
//     const body = `979${String(seed).padStart(9, '0').slice(-9)}`;
//     const sum = body
//         .split('')
//         .reduce((acc, digit, index) => acc + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
//     const check = (10 - (sum % 10)) % 10;
//     return `${body}${check}`;
// }

// function makeVariantIsbn(book: SeedBook, bookIndex: number, variantIndex: number) {
//     if (variantIndex === 0) return book.isbn13;
//     return isbn13FromSeed(900000000 + bookIndex * 10 + variantIndex);
// }

// function physicalStockForBook(bookIndex: number) {
//     const stocks = [10, 20, 35, 50, 75, 100, 120, 150, 180, 200];
//     return stocks[bookIndex % stocks.length];
// }

// const CURRENCY_CODE_VND = CurrencyCode.VND;
// const CUSTOMER_COUNT = 36;

// // =============================================================================
// // Permissions + Roles + RolePermissions
// // =============================================================================

// type PermissionSeed = {
//     code: PermissionCode;
//     method: HTTPMethod;
//     pathPattern: string;
//     description: string;
//     isActive?: boolean;
// };

// const PERMISSIONS: PermissionSeed[] = [
//     { code: PermissionCode.HEALTH_READ, method: HTTPMethod.GET, pathPattern: '/api/v1/health', description: 'Read service health' },
//     { code: PermissionCode.GUEST_SESSION_GET_ALL, method: HTTPMethod.GET, pathPattern: '/api/v1/guest-session', description: 'List guest sessions' },

//     { code: PermissionCode.ROLE_READ, method: HTTPMethod.GET, pathPattern: '/api/v1/role', description: 'List roles' },
//     { code: PermissionCode.ROLE_READ_ONE, method: HTTPMethod.GET, pathPattern: '/api/v1/role/:name', description: 'Get role by name' },

//     { code: PermissionCode.PERMISSION_READ, method: HTTPMethod.GET, pathPattern: '/api/v1/permission', description: 'List permissions' },
//     { code: PermissionCode.PERMISSION_CREATE, method: HTTPMethod.POST, pathPattern: '/api/v1/permission', description: 'Create permission' },
//     { code: PermissionCode.PERMISSION_UPDATE, method: HTTPMethod.PATCH, pathPattern: '/api/v1/permission/:id', description: 'Update permission' },
//     { code: PermissionCode.PERMISSION_DELETE, method: HTTPMethod.DELETE, pathPattern: '/api/v1/permission/:id', description: 'Delete permission' },

//     { code: PermissionCode.ROLE_PERMISSION_GRANT, method: HTTPMethod.POST, pathPattern: '/api/v1/role-permission', description: 'Grant permission to role' },
//     { code: PermissionCode.ROLE_PERMISSION_READ_BY_ROLE, method: HTTPMethod.GET, pathPattern: '/api/v1/role-permission/role/:roleId', description: 'List permissions of a role' },
//     { code: PermissionCode.ROLE_PERMISSION_READ_BY_PERMISSION, method: HTTPMethod.GET, pathPattern: '/api/v1/role-permission/permission/:permissionId', description: 'List roles that have a permission' },

//     { code: PermissionCode.DEVICE_READ, method: HTTPMethod.GET, pathPattern: '/api/v1/device', description: 'List devices' },
//     { code: PermissionCode.LOGIN_ATTEMPT_READ_BY_USER, method: HTTPMethod.GET, pathPattern: '/api/v1/login-attempt/user/:userId', description: 'List login attempts by user id' },
//     { code: PermissionCode.EMAIL_OUTBOX_GET, method: HTTPMethod.GET, pathPattern: '/api/v1/email-outbox', description: 'List email outbox by filter' },
//     { code: PermissionCode.SEARCH_REINDEX_BOOKS, method: HTTPMethod.POST, pathPattern: '/api/v1/search/reindex', description: 'Reindex search vectors in Pinecone' },

//     { code: PermissionCode.AUTHOR_CREATE, method: HTTPMethod.POST, pathPattern: '/api/v1/authors', description: 'Create author' },
//     { code: PermissionCode.PUBLISHER_CREATE, method: HTTPMethod.POST, pathPattern: '/api/v1/publishers', description: 'Create publisher' },
//     { code: PermissionCode.CATEGORY_CREATE, method: HTTPMethod.POST, pathPattern: '/api/v1/categories', description: 'Create category' },

//     { code: PermissionCode.SUPPLIER_READ, method: HTTPMethod.GET, pathPattern: '/api/v1/suppliers', description: 'List suppliers' },
//     { code: PermissionCode.SUPPLIER_CREATE, method: HTTPMethod.POST, pathPattern: '/api/v1/suppliers', description: 'Create supplier' },
//     { code: PermissionCode.SUPPLIER_UPDATE, method: HTTPMethod.PATCH, pathPattern: '/api/v1/suppliers/:supplierId/active', description: 'Toggle supplier active status' },

//     { code: PermissionCode.ADMIN_CREATE_BOOK, method: HTTPMethod.POST, pathPattern: '/api/v1/admin/books', description: 'Create admin book' },
//     { code: PermissionCode.ADMIN_CREATE_BOOK_ALL, method: HTTPMethod.POST, pathPattern: '/api/v1/admin/books/all', description: 'Create admin book with full payload' },
//     { code: PermissionCode.ADMIN_UPDATE_BOOK, method: HTTPMethod.PATCH, pathPattern: '/api/v1/admin/books/:bookId', description: 'Update admin book' },
//     { code: PermissionCode.ADMIN_DELETE_BOOK, method: HTTPMethod.DELETE, pathPattern: '/api/v1/admin/books/:bookId', description: 'Soft delete admin book' },
//     { code: PermissionCode.ADMIN_READ_DETAIL, method: HTTPMethod.GET, pathPattern: '/api/v1/admin/books/:bookId', description: 'Read admin book detail' },
//     { code: PermissionCode.ADMIN_READ, method: HTTPMethod.GET, pathPattern: '/api/v1/admin/*', description: 'Read admin resources' },

//     { code: PermissionCode.UPLOAD_MANAGE, method: HTTPMethod.POST, pathPattern: '/api/v1/uploads/*', description: 'Upload files and confirm book assets' },

//     { code: PermissionCode.AUTH_REGISTER, method: HTTPMethod.POST, pathPattern: '/api/v1/auth/register', description: 'Register user' },
//     { code: PermissionCode.AUTH_LOGIN, method: HTTPMethod.POST, pathPattern: '/api/v1/auth/login', description: 'Login' },
//     { code: PermissionCode.AUTH_ME_READ, method: HTTPMethod.GET, pathPattern: '/api/v1/auth/me', description: 'Get current user profile' },
//     { code: PermissionCode.AUTH_TOKEN_REFRESH, method: HTTPMethod.POST, pathPattern: '/api/v1/auth/refresh-token', description: 'Refresh access token' },
//     { code: PermissionCode.AUTH_LOGOUT, method: HTTPMethod.POST, pathPattern: '/api/v1/auth/logout', description: 'Logout' },
//     { code: PermissionCode.AUTH_PASSWORD_FORGOT, method: HTTPMethod.POST, pathPattern: '/api/v1/auth/forgot-password', description: 'Request password reset' },
//     { code: PermissionCode.AUTH_EMAIL_VERIFY, method: HTTPMethod.GET, pathPattern: '/api/v1/auth/verify-email', description: 'Verify email' },
//     { code: PermissionCode.AUTH_EMAIL_RESEND, method: HTTPMethod.POST, pathPattern: '/api/v1/auth/resend-email', description: 'Resend verification email' },
//     { code: PermissionCode.AUTH_PASSWORD_CHANGE, method: HTTPMethod.POST, pathPattern: '/api/v1/auth/change-password', description: 'Change password' },
//     { code: PermissionCode.AUTH_PASSWORD_RESET_VALIDATE, method: HTTPMethod.POST, pathPattern: '/api/v1/auth/reset-password/validate', description: 'Validate reset password token' },
//     { code: PermissionCode.AUTH_PASSWORD_RESET, method: HTTPMethod.POST, pathPattern: '/api/v1/auth/reset-password', description: 'Reset password' },
// ];

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
// const ALL_PERMISSION_CODES: PermissionCode[] = Object.values(PermissionCode) as PermissionCode[];

// const ROLE_PERMISSION_MAP: Record<RoleCode, PermissionCode[]> = {
//     [RoleCode.ADMIN]: ALL_PERMISSION_CODES,
//     [RoleCode.STAFF]: STAFF_PERMISSIONS,
//     [RoleCode.WAREHOUSE]: WAREHOUSE_PERMISSIONS,
//     [RoleCode.CUSTOMER]: CUSTOMER_PERMISSIONS,
//     [RoleCode.GUEST]: GUEST_PERMISSIONS,
// };

// async function upsertRoles() {
//     const roles = [
//         { code: RoleCode.ADMIN, name: 'admin', description: 'Full system access' },
//         { code: RoleCode.STAFF, name: 'staff', description: 'Backoffice catalog/order staff' },
//         { code: RoleCode.WAREHOUSE, name: 'warehouse', description: 'Warehouse and stock staff' },
//         { code: RoleCode.CUSTOMER, name: 'customer', description: 'Registered bookstore customer' },
//         { code: RoleCode.GUEST, name: 'guest', description: 'Guest checkout role, no seeded user' },
//     ];

//     for (const role of roles) {
//         await prisma.role.upsert({
//             where: { code: role.code },
//             update: {
//                 name: role.name,
//                 description: role.description,
//                 isActive: true,
//                 deletedAt: null,
//             },
//             create: {
//                 code: role.code,
//                 name: role.name,
//                 description: role.description,
//                 isActive: true,
//             },
//         });
//     }

//     const rows = await prisma.role.findMany({ select: { id: true, code: true } });
//     return new Map(rows.map((row) => [row.code, row.id] as const));
// }

// async function upsertPermissions() {
//     for (const permission of PERMISSIONS) {
//         await prisma.permission.upsert({
//             where: { code: permission.code },
//             update: {
//                 description: permission.description,
//                 method: permission.method,
//                 pathPattern: permission.pathPattern,
//                 isActive: permission.isActive ?? true,
//                 deletedAt: null,
//             },
//             create: {
//                 code: permission.code,
//                 description: permission.description,
//                 method: permission.method,
//                 pathPattern: permission.pathPattern,
//                 isActive: permission.isActive ?? true,
//             },
//         });
//     }

//     const rows = await prisma.permission.findMany({ select: { id: true, code: true } });
//     return new Map(rows.map((row) => [row.code as PermissionCode, row.id] as const));
// }

// async function seedRolePermissions(
//     roleIdByCode: Map<RoleCode, number>,
//     permissionIdByCode: Map<PermissionCode, number>,
// ) {
//     let totalGranted = 0;
//     let totalSkipped = 0;

//     for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSION_MAP) as [RoleCode, PermissionCode[]][]) {
//         const roleId = roleIdByCode.get(roleCode);
//         if (!roleId) {
//             console.warn(`[role-permission] Skip role not found: ${roleCode}`);
//             continue;
//         }

//         const uniqueCodes = [...new Set(permCodes)];
//         for (const permCode of uniqueCodes) {
//             const permissionId = permissionIdByCode.get(permCode);
//             if (!permissionId) {
//                 console.warn(`[role-permission] Skip permission not found: ${permCode}`);
//                 totalSkipped += 1;
//                 continue;
//             }

//             await prisma.rolePermission.upsert({
//                 where: { roleId_permissionId: { roleId, permissionId } },
//                 update: {},
//                 create: { roleId, permissionId },
//             });
//             totalGranted += 1;
//         }

//         console.log(`Role ${roleCode.padEnd(12)} -> ${uniqueCodes.length} permissions`);
//     }

//     console.log(`RolePermission seed done: ${totalGranted} granted, ${totalSkipped} skipped`);
// }

// // =============================================================================
// // Suppliers
// // =============================================================================

// type SupplierSeed = { code: string; name: string };

// const SUPPLIERS: SupplierSeed[] = [
//     { code: 'SUP-FAHASA', name: 'Công ty Cổ phần Phát hành Sách TP.HCM - Fahasa' },
//     { code: 'SUP-PHUONGNAM', name: 'Công ty Sách Phương Nam' },
//     { code: 'SUP-ALPHA', name: 'Alpha Books' },
//     { code: 'SUP-THAIHA', name: 'Thái Hà Books' },
//     { code: 'SUP-NHANAM', name: 'Nhã Nam' },
//     { code: 'SUP-KIMDONG', name: 'Nhà xuất bản Kim Đồng' },
//     { code: 'SUP-FIRSTNEWS', name: 'First News - Trí Việt' },
//     { code: 'SUP-TRE', name: 'Nhà xuất bản Trẻ' },
//     { code: 'SUP-OMEGA', name: 'Omega Plus Books' },
//     { code: 'SUP-DINHTI', name: 'Đinh Tị Books' },
//     { code: 'SUP-1980', name: '1980 Books' },
//     { code: 'SUP-AZVIETNAM', name: 'AZ Việt Nam' },
//     { code: 'SUP-PEARSON', name: 'Pearson Education Asia' },
//     { code: 'SUP-OREILLY', name: "O'Reilly Media Wholesale" },
//     { code: 'SUP-SPRINGER', name: 'Springer Nature SEA' },
//     { code: 'SUP-PENGUIN', name: 'Penguin Random House SEA' },
//     { code: 'SUP-HARPERCOLLINS', name: 'HarperCollins SEA' },
//     { code: 'SUP-MCGRAW', name: 'McGraw Hill Education' },
//     { code: 'SUP-OXFORD', name: 'Oxford University Press Distribution' },
//     { code: 'SUP-CAMBRIDGE', name: 'Cambridge University Press Distribution' },
//     { code: 'SUP-TIKI', name: 'Tiki Trading - Book Division' },
//     { code: 'SUP-VINABOOK', name: 'Vinabook Distribution' },
// ];

// async function upsertSuppliers() {
//     for (const supplier of SUPPLIERS) {
//         await prisma.supplier.upsert({
//             where: { code: supplier.code },
//             update: {
//                 name: supplier.name,
//                 isActive: true,
//             },
//             create: {
//                 code: supplier.code,
//                 name: supplier.name,
//                 isActive: true,
//             },
//         });
//     }

//     const rows = await prisma.supplier.findMany({ select: { id: true, code: true } });
//     return new Map(rows.map((row) => [row.code, row.id] as const));
// }

// // =============================================================================
// // Languages + Categories
// // =============================================================================

// async function upsertLanguages() {
//     const languages = [
//         { code: 'vi', name: 'Tiếng Việt' },
//         { code: 'en', name: 'English' },
//     ];

//     for (const language of languages) {
//         await prisma.language.upsert({
//             where: { code: language.code },
//             update: {
//                 name: language.name,
//                 isActive: true,
//             },
//             create: {
//                 code: language.code,
//                 name: language.name,
//                 isActive: true,
//             },
//         });
//     }

//     const rows = await prisma.language.findMany({ select: { id: true, code: true } });
//     return new Map(rows.map((row) => [row.code, row.id] as const));
// }

// type SeedCategory = {
//     slug: string;
//     sortOrder: number;
//     viName: string;
//     enName: string;
//     parentSlug?: string;
//     viDescription: string;
//     enDescription: string;
// };

// const CATEGORIES: SeedCategory[] = [
//     {
//         slug: 'technology',
//         sortOrder: 1,
//         viName: 'Công nghệ',
//         enName: 'Technology',
//         viDescription: 'Nhóm sách về công nghệ hiện đại, gồm lập trình, vận hành hệ thống, bảo mật và dữ liệu.',
//         enDescription: 'Technology books covering programming, infrastructure, security, and modern data systems.',
//     },
//     {
//         slug: 'programming',
//         sortOrder: 2,
//         parentSlug: 'technology',
//         viName: 'Lập trình',
//         enName: 'Programming',
//         viDescription: 'Sách tập trung kỹ thuật coding thực chiến, clean code, testing và tối ưu chất lượng phần mềm.',
//         enDescription: 'Hands-on coding books focused on clean code, testing, and practical engineering quality.',
//     },
//     {
//         slug: 'software-architecture',
//         sortOrder: 3,
//         parentSlug: 'technology',
//         viName: 'Kiến trúc phần mềm',
//         enName: 'Software Architecture',
//         viDescription: 'Nội dung về kiến trúc hệ thống, phân rã domain, mở rộng và vận hành ổn định trên quy mô lớn.',
//         enDescription: 'Software architecture, domain boundaries, scalability, and resilient system design at scale.',
//     },
//     {
//         slug: 'devops-cloud',
//         sortOrder: 4,
//         parentSlug: 'technology',
//         viName: 'DevOps và Cloud',
//         enName: 'DevOps & Cloud',
//         viDescription: 'Sách về CI/CD, container, cloud native và quản trị hạ tầng theo hướng tự động hóa.',
//         enDescription: 'DevOps and cloud-native books on CI/CD, containers, automation, and infrastructure operations.',
//     },
//     {
//         slug: 'cybersecurity',
//         sortOrder: 5,
//         parentSlug: 'technology',
//         viName: 'An toàn thông tin',
//         enName: 'Cybersecurity',
//         viDescription: 'Kiến thức về phòng thủ ứng dụng, quản lý rủi ro và triển khai bảo mật trong vòng đời sản phẩm.',
//         enDescription: 'Cybersecurity practices for secure-by-design software, threat modeling, and risk management.',
//     },
//     {
//         slug: 'data-ai',
//         sortOrder: 6,
//         parentSlug: 'technology',
//         viName: 'Dữ liệu và AI',
//         enName: 'Data & AI',
//         viDescription: 'Sách về data engineering, phân tích dữ liệu và ứng dụng machine learning cho bài toán thực tế.',
//         enDescription: 'Data engineering, analytics, and applied AI books for production-ready decision systems.',
//     },
//     {
//         slug: 'business-economics',
//         sortOrder: 7,
//         viName: 'Kinh doanh và kinh tế',
//         enName: 'Business & Economics',
//         viDescription: 'Nhóm sách về tăng trưởng doanh nghiệp, vận hành, chiến lược sản phẩm và mô hình tài chính.',
//         enDescription: 'Business and economics titles about growth, operations, product strategy, and financial models.',
//     },
//     {
//         slug: 'entrepreneurship',
//         sortOrder: 8,
//         parentSlug: 'business-economics',
//         viName: 'Khởi nghiệp',
//         enName: 'Entrepreneurship',
//         viDescription: 'Sách cho nhà sáng lập: xác thực ý tưởng, tìm product-market fit và xây dựng đội ngũ ban đầu.',
//         enDescription: 'Entrepreneurship books on validation, product-market fit, and early team execution.',
//     },
//     {
//         slug: 'management-leadership',
//         sortOrder: 9,
//         parentSlug: 'business-economics',
//         viName: 'Quản trị và lãnh đạo',
//         enName: 'Management & Leadership',
//         viDescription: 'Nội dung về vận hành đội ngũ, đánh giá hiệu suất, lập kế hoạch và ra quyết định lãnh đạo.',
//         enDescription: 'Management and leadership books on team operations, planning, feedback, and decision quality.',
//     },
//     {
//         slug: 'marketing-sales',
//         sortOrder: 10,
//         parentSlug: 'business-economics',
//         viName: 'Marketing và bán hàng',
//         enName: 'Marketing & Sales',
//         viDescription: 'Sách hướng dẫn xây dựng thông điệp, kênh tiếp cận và hệ thống chuyển đổi doanh thu ổn định.',
//         enDescription: 'Books on positioning, channel strategy, and conversion-focused marketing and sales execution.',
//     },
//     {
//         slug: 'finance-investing',
//         sortOrder: 11,
//         parentSlug: 'business-economics',
//         viName: 'Tài chính và đầu tư',
//         enName: 'Finance & Investing',
//         viDescription: 'Sách tài chính cá nhân, phân tích báo cáo tài chính và các nguyên tắc đầu tư bền vững.',
//         enDescription: 'Finance books covering personal money systems, statement analysis, and long-term investing.',
//     },
//     {
//         slug: 'mind-society',
//         sortOrder: 12,
//         viName: 'Tâm trí và xã hội',
//         enName: 'Mind & Society',
//         viDescription: 'Nhóm sách khai phá hành vi con người, bối cảnh xã hội và tư duy để hiểu sâu các quyết định.',
//         enDescription: 'Mind and society books exploring behavior, culture, institutions, and decision dynamics.',
//     },
//     {
//         slug: 'psychology',
//         sortOrder: 13,
//         parentSlug: 'mind-society',
//         viName: 'Tâm lý học',
//         enName: 'Psychology',
//         viDescription: 'Sách tâm lý ứng dụng cho học tập, công việc và quản lý bản thân theo hướng thực hành.',
//         enDescription: 'Practical psychology books for habits, motivation, communication, and personal effectiveness.',
//     },
//     {
//         slug: 'history',
//         sortOrder: 14,
//         parentSlug: 'mind-society',
//         viName: 'Lịch sử',
//         enName: 'History',
//         viDescription: 'Sách lịch sử theo hướng tổng hợp bối cảnh, nhân quả và bài học cho hiện tại.',
//         enDescription: 'History titles connecting context, causality, and practical lessons for current society.',
//     },
//     {
//         slug: 'philosophy',
//         sortOrder: 15,
//         parentSlug: 'mind-society',
//         viName: 'Triết học',
//         enName: 'Philosophy',
//         viDescription: 'Sách triết học ứng dụng giúp làm rõ hệ giá trị, nâng cao năng lực lập luận và phản biện.',
//         enDescription: 'Applied philosophy books for reasoning, ethics, values, and structured critical thinking.',
//     },
//     {
//         slug: 'social-issues',
//         sortOrder: 16,
//         parentSlug: 'mind-society',
//         viName: 'Vấn đề xã hội',
//         enName: 'Social Issues',
//         viDescription: 'Sách phân tích những thách thức xã hội đương đại như công dân số, đạo đức dữ liệu và AI.',
//         enDescription: 'Books on modern social issues such as digital citizenship, data ethics, and AI governance.',
//     },
//     {
//         slug: 'literature-arts',
//         sortOrder: 17,
//         viName: 'Văn học và nghệ thuật',
//         enName: 'Literature & Arts',
//         viDescription: 'Nhóm sách văn học với giá trị cảm xúc, ngôn ngữ và nghệ thuật kể chuyện.',
//         enDescription: 'Literature and arts books centered on narrative craft, language, and emotional depth.',
//     },
//     {
//         slug: 'fiction',
//         sortOrder: 18,
//         parentSlug: 'literature-arts',
//         viName: 'Tiểu thuyết',
//         enName: 'Fiction',
//         viDescription: 'Tiểu thuyết đương đại và kinh điển, khắc họa nhân vật rõ nét và xung đột đầy sức nặng.',
//         enDescription: 'Fiction titles with strong character arcs, layered conflicts, and memorable narrative voice.',
//     },
//     {
//         slug: 'short-stories',
//         sortOrder: 19,
//         parentSlug: 'literature-arts',
//         viName: 'Truyện ngắn',
//         enName: 'Short Stories',
//         viDescription: 'Tuyển tập truyện ngắn tinh gọn, giàu hình ảnh và một kết thúc có dư âm.',
//         enDescription: 'Short story collections with concise structure, vivid imagery, and resonant endings.',
//     },
//     {
//         slug: 'children-ya',
//         sortOrder: 20,
//         parentSlug: 'literature-arts',
//         viName: 'Thiếu nhi và tuổi mới lớn',
//         enName: 'Children & YA',
//         viDescription: 'Sách cho thiếu nhi và tuổi mới lớn với tính giáo dục, trí tưởng tượng và lòng nhân ái.',
//         enDescription: 'Children and YA books blending imagination, empathy, and age-appropriate life lessons.',
//     },
//     {
//         slug: 'education-skills',
//         sortOrder: 21,
//         viName: 'Học tập và kỹ năng',
//         enName: 'Education & Skills',
//         viDescription: 'Nhóm sách hướng dẫn kỹ năng học tập, giao tiếp, ngoại ngữ và nâng cao năng lực cá nhân.',
//         enDescription: 'Education and skills books on learning methods, communication, language, and self-improvement.',
//     },
//     {
//         slug: 'language-learning',
//         sortOrder: 22,
//         parentSlug: 'education-skills',
//         viName: 'Học ngoại ngữ',
//         enName: 'Language Learning',
//         viDescription: 'Sách học ngoại ngữ theo ngữ cảnh thực tế, nhanh nhớ và dễ áp dụng trong giao tiếp.',
//         enDescription: 'Language learning books with context-driven methods for practical communication fluency.',
//     },
//     {
//         slug: 'productivity-learning',
//         sortOrder: 23,
//         parentSlug: 'education-skills',
//         viName: 'Năng suất và phương pháp học',
//         enName: 'Productivity & Learning',
//         viDescription: 'Sách về quản lý thời gian, tập trung sâu và xây dựng hệ thống học tập bền vững.',
//         enDescription: 'Books on deep focus, time management, and building sustainable long-term learning systems.',
//     },
//     {
//         slug: 'communication',
//         sortOrder: 24,
//         parentSlug: 'education-skills',
//         viName: 'Giao tiếp',
//         enName: 'Communication',
//         viDescription: 'Sách rèn luyện kỹ năng trình bày, đàm phán, phản hồi và giao tiếp đa ngữ cảnh.',
//         enDescription: 'Communication books for presentations, negotiation, feedback culture, and collaboration.',
//     },
// ];

// async function upsertCategories(languageIdByCode: Map<string, number>, createdBy?: number) {
//     const viLanguageId = languageIdByCode.get('vi');
//     const enLanguageId = languageIdByCode.get('en');
//     if (!viLanguageId || !enLanguageId) throw new Error('Missing vi/en language seed');

//     const categoryIdBySlug = new Map<string, number>();

//     for (const category of CATEGORIES) {
//         const parentId = category.parentSlug ? categoryIdBySlug.get(category.parentSlug) ?? null : null;

//         const existing = await prisma.categoryTranslation.findFirst({
//             where: { languageId: viLanguageId, slug: category.slug },
//             select: { categoryId: true },
//         });

//         let categoryId: number;
//         if (existing) {
//             categoryId = existing.categoryId;
//             await prisma.category.update({
//                 where: { id: categoryId },
//                 data: {
//                     parentId,
//                     isActive: true,
//                     sortOrder: category.sortOrder,
//                     deletedAt: null,
//                     updatedBy: createdBy,
//                 },
//             });
//         } else {
//             const created = await prisma.category.create({
//                 data: {
//                     parentId,
//                     isActive: true,
//                     sortOrder: category.sortOrder,
//                     createdBy,
//                     updatedBy: createdBy,
//                 },
//                 select: { id: true },
//             });
//             categoryId = created.id;
//         }

//         await prisma.categoryTranslation.upsert({
//             where: { categoryId_languageId: { categoryId, languageId: viLanguageId } },
//             update: {
//                 name: category.viName,
//                 slug: category.slug,
//                 description: category.viDescription,
//             },
//             create: {
//                 categoryId,
//                 languageId: viLanguageId,
//                 name: category.viName,
//                 slug: category.slug,
//                 description: category.viDescription,
//             },
//         });

//         await prisma.categoryTranslation.upsert({
//             where: { categoryId_languageId: { categoryId, languageId: enLanguageId } },
//             update: {
//                 name: category.enName,
//                 slug: category.slug,
//                 description: category.enDescription,
//             },
//             create: {
//                 categoryId,
//                 languageId: enLanguageId,
//                 name: category.enName,
//                 slug: category.slug,
//                 description: category.enDescription,
//             },
//         });

//         categoryIdBySlug.set(category.slug, categoryId);
//     }

//     return categoryIdBySlug;
// }

// // =============================================================================
// // Users + Addresses
// // =============================================================================

// type SeedUser = {
//     email: string;
//     password: string;
//     firstName: string;
//     lastName: string;
//     phoneNumber: string;
//     gender?: string;
//     avatarUrl?: string;
//     isEmailVerified?: boolean;
//     status?: UserStatus;
//     roleCodes: RoleCode[];
// };

// type SeededUser = {
//     id: number;
//     email: string;
//     firstName: string | null;
//     lastName: string | null;
//     phoneNumber: string | null;
// };

// const FIXED_USERS: SeedUser[] = [
//     {
//         email: 'admin.nguyen@bookstore.local',
//         password: 'Admin@123456',
//         firstName: 'Minh',
//         lastName: 'Nguyễn',
//         phoneNumber: '0901000001',
//         gender: 'male',
//         isEmailVerified: true,
//         roleCodes: [RoleCode.ADMIN],
//     },
//     {
//         email: 'staff.lan@bookstore.local',
//         password: 'Staff@123456',
//         firstName: 'Lan',
//         lastName: 'Trần',
//         phoneNumber: '0901000002',
//         gender: 'female',
//         isEmailVerified: true,
//         roleCodes: [RoleCode.STAFF],
//     },
//     {
//         email: 'staff.hoang@bookstore.local',
//         password: 'Staff@123456',
//         firstName: 'Hoàng',
//         lastName: 'Phạm',
//         phoneNumber: '0901000003',
//         gender: 'male',
//         isEmailVerified: true,
//         roleCodes: [RoleCode.STAFF],
//     },
//     {
//         email: 'warehouse.khoa@bookstore.local',
//         password: 'Warehouse@123456',
//         firstName: 'Khoa',
//         lastName: 'Lê',
//         phoneNumber: '0901000004',
//         gender: 'male',
//         isEmailVerified: true,
//         roleCodes: [RoleCode.WAREHOUSE],
//     },
// ];

// const CUSTOMER_NAMES = [
//     ['An', 'Nguyễn'], ['Bình', 'Trần'], ['Chi', 'Lê'], ['Dũng', 'Phạm'], ['Giang', 'Hoàng'], ['Hạnh', 'Vũ'],
//     ['Khánh', 'Đỗ'], ['Linh', 'Đặng'], ['Minh', 'Bùi'], ['Nam', 'Phan'], ['Phương', 'Ngô'], ['Quang', 'Dương'],
//     ['Thảo', 'Lý'], ['Trang', 'Mai'], ['Vy', 'Tô'], ['Huy', 'Đinh'], ['Tuấn', 'Cao'], ['Nhi', 'Võ'],
//     ['Tâm', 'Hồ'], ['Sơn', 'Đào'], ['My', 'Trương'], ['Kiên', 'Huỳnh'], ['Như', 'Lâm'], ['Long', 'Đoàn'],
//     ['Yến', 'Châu'], ['Thiện', 'Vương'], ['Bảo', 'Nguyễn'], ['Mai', 'Trần'], ['Tú', 'Lê'], ['Ngọc', 'Phạm'],
//     ['Hiếu', 'Hoàng'], ['Vân', 'Vũ'], ['Đức', 'Đỗ'], ['Hà', 'Đặng'], ['Quỳnh', 'Bùi'], ['Tín', 'Phan'],
// ];

// const ADDRESS_POOL = [
//     { city: 'Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé' },
//     { city: 'Hồ Chí Minh', district: 'Quận 3', ward: 'Võ Thị Sáu' },
//     { city: 'Hồ Chí Minh', district: 'Quận 7', ward: 'Tân Phong' },
//     { city: 'Hồ Chí Minh', district: 'Thành phố Thủ Đức', ward: 'An Phú' },
//     { city: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng' },
//     { city: 'Hà Nội', district: 'Thanh Xuân', ward: 'Khương Trung' },
//     { city: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'Hàng Bạc' },
//     { city: 'Đà Nẵng', district: 'Hải Châu', ward: 'Hòa Cường Bắc' },
//     { city: 'Đà Nẵng', district: 'Sơn Trà', ward: 'An Hải Bắc' },
//     { city: 'Cần Thơ', district: 'Ninh Kiều', ward: 'An Hòa' },
//     { city: 'Hải Phòng', district: 'Lê Chân', ward: 'An Biên' },
//     { city: 'Khánh Hòa', district: 'Nha Trang', ward: 'Vĩnh Hải' },
//     { city: 'Bình Dương', district: 'Thủ Dầu Một', ward: 'Phú Cường' },
//     { city: 'Đồng Nai', district: 'Biên Hòa', ward: 'Tân Phong' },
// ];

// const STREET_POOL = [
//     'Nguyễn Huệ', 'Lê Lợi', 'Trần Hưng Đạo', 'Hai Bà Trưng', 'Pasteur',
//     'Cách Mạng Tháng 8', 'Điện Biên Phủ', 'Võ Văn Tần', 'Nguyễn Trãi', 'Phan Đình Phùng',
// ];

// async function upsertUserWithRoles(user: SeedUser, roleIdByCode: Map<RoleCode, number>) {
//     const password = await bcrypt.hash(user.password, 12);

//     const row = await prisma.user.upsert({
//         where: { email: user.email },
//         update: {
//             firstName: user.firstName,
//             lastName: user.lastName,
//             phoneNumber: user.phoneNumber,
//             gender: user.gender,
//             avatarUrl: user.avatarUrl,
//             password,
//             passwordChangedAt: new Date(),
//             isEmailVerified: user.isEmailVerified ?? true,
//             verifyEmailAt: user.isEmailVerified === false ? null : new Date(),
//             status: user.status ?? UserStatus.ACTIVE,
//             deletedAt: null,
//         },
//         create: {
//             email: user.email,
//             firstName: user.firstName,
//             lastName: user.lastName,
//             phoneNumber: user.phoneNumber,
//             gender: user.gender,
//             avatarUrl: user.avatarUrl,
//             password,
//             passwordChangedAt: new Date(),
//             isEmailVerified: user.isEmailVerified ?? true,
//             verifyEmailAt: user.isEmailVerified === false ? null : new Date(),
//             status: user.status ?? UserStatus.ACTIVE,
//         },
//         select: {
//             id: true,
//             email: true,
//             firstName: true,
//             lastName: true,
//             phoneNumber: true,
//         },
//     });

//     await prisma.userRole.deleteMany({ where: { userId: row.id } });

//     await prisma.userRole.createMany({
//         data: user.roleCodes.map((roleCode) => {
//             const roleId = roleIdByCode.get(roleCode);
//             if (!roleId) throw new Error(`Role not found: ${roleCode}`);
//             return { userId: row.id, roleId };
//         }),
//         skipDuplicates: true,
//     });

//     return row;
// }

// async function seedAddressesForUser(user: SeededUser) {
//     await prisma.userAddress.deleteMany({ where: { userId: user.id } });

//     const addressCount = randomInt(2, 4);
//     const chosenLocations = takeRandomUnique(ADDRESS_POOL, addressCount);
//     const fullName = `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim() || 'Khách hàng';

//     for (let index = 0; index < chosenLocations.length; index += 1) {
//         const location = chosenLocations[index];

//         await prisma.userAddress.create({
//             data: {
//                 userId: user.id,
//                 addressType: index === 0 ? AddressType.HOME : randomOne([AddressType.HOME, AddressType.WORK, AddressType.OTHER]),
//                 recipientName: fullName,
//                 phoneNumber: user.phoneNumber ?? `09${randomInt(10000000, 99999999)}`,
//                 addressDetail: `Số ${randomInt(1, 350)} đường ${randomOne(STREET_POOL)}`,
//                 ward: location.ward,
//                 district: location.district,
//                 city: location.city,
//                 isDefault: index === 0,
//             },
//         });
//     }
// }

// function buildCustomerSeedUsers() {
//     return CUSTOMER_NAMES.slice(0, CUSTOMER_COUNT).map(([firstName, lastName], index) => ({
//         email: `customer${String(index + 1).padStart(2, '0')}@bookstore.local`,
//         password: 'Customer@123456',
//         firstName,
//         lastName,
//         phoneNumber: `09${String(20000000 + index).padStart(8, '0')}`,
//         gender: index % 2 === 0 ? 'male' : 'female',
//         isEmailVerified: true,
//         roleCodes: [RoleCode.CUSTOMER],
//     })) satisfies SeedUser[];
// }

// async function seedUsers(roleIdByCode: Map<RoleCode, number>) {
//     const users: SeededUser[] = [];

//     for (const user of [...FIXED_USERS, ...buildCustomerSeedUsers()]) {
//         const row = await upsertUserWithRoles(user, roleIdByCode);
//         users.push(row);
//     }

//     for (const user of users) {
//         await seedAddressesForUser(user);
//     }

//     const admin = users.find((user) => user.email === 'admin.nguyen@bookstore.local') ?? users[0];
//     console.log(`Seeded users: ${users.length} (admin/staff/warehouse/customer), guest user = 0`);
//     return { users, admin };
// }

// // =============================================================================
// // Book image URLs from uploaded scraper CSV
// // =============================================================================

// const COVER_IMAGE_URLS = [
//     "https://i.pinimg.com/originals/95/76/ea/9576ea09f6201b300b8669d8a4c9e6e5.jpg",
//     "https://i.pinimg.com/originals/a8/31/c8/a831c82d2a4247d065c7cd1d591cdee1.jpg",
//     "https://i.pinimg.com/originals/1b/1a/ca/1b1aca18ff3b883595efb18c82eba9cd.jpg",
//     "https://i.pinimg.com/originals/00/c3/d1/00c3d1977d487c78ad2ce926dd047dc3.jpg",
//     "https://i.pinimg.com/originals/fd/54/b0/fd54b0767661602a3af6e69a5f7b338c.png",
//     "https://i.pinimg.com/originals/55/f3/a0/55f3a0adb54d7fefd2500012400042a8.jpg",
//     "https://i.pinimg.com/originals/f4/02/f3/f402f3d6920e85c60a1a8df3330047ba.png",
//     "https://i.pinimg.com/originals/7d/41/f9/7d41f9df469423395802a803700b8569.png",
//     "https://i.pinimg.com/originals/64/1a/37/641a37ccbd14e57eca3f75de8748c668.jpg",
//     "https://i.pinimg.com/originals/9a/ae/90/9aae909acbabe1093e54ce2af9449724.jpg",
//     "https://i.pinimg.com/originals/99/37/86/9937867da0c3f3342dcb2d0aba3cf10b.jpg",
//     "https://i.pinimg.com/originals/ab/ef/1d/abef1d84b748895e3b963eeb45c334e5.jpg",
//     "https://i.pinimg.com/originals/bd/f2/f2/bdf2f2d62e71430cda124bee053e423c.jpg",
//     "https://i.pinimg.com/originals/88/04/f3/8804f3b67da11125ad7fddbdbd07993d.jpg",
//     "https://i.pinimg.com/originals/d6/38/71/d638716b83c9de3c57d066317118410f.jpg",
//     "https://i.pinimg.com/originals/8c/d6/09/8cd60928b5a93efc3e03de88a75c8dde.jpg",
//     "https://i.pinimg.com/originals/e9/90/31/e99031c2893b988eb57bc7260c764c86.jpg",
//     "https://i.pinimg.com/originals/0f/5d/fa/0f5dfa9912413198fa4236b240051efa.jpg",
//     "https://i.pinimg.com/originals/6f/35/c5/6f35c5baf89067e99757032760c04c40.jpg",
//     "https://i.pinimg.com/originals/40/d6/61/40d6612a6dea426c2d1008c35fabf275.jpg",
//     "https://i.pinimg.com/originals/43/61/3e/43613efe861882fb6b56a17a9dbf7417.jpg",
//     "https://i.pinimg.com/originals/26/1e/72/261e724619081c880a26ca4a794d2ccf.jpg",
//     "https://i.pinimg.com/originals/68/94/a8/6894a819da48312befd6be1d334008bd.png",
//     "https://i.pinimg.com/originals/2a/cf/7c/2acf7c9dae8f2b66c99853339f79b4cc.jpg",
//     "https://i.pinimg.com/originals/d9/9b/f6/d99bf64333698b50604dec16fcd5c908.jpg",
//     "https://i.pinimg.com/originals/fe/dd/21/fedd21bfceddac1f7420c7237a938914.jpg",
//     "https://i.pinimg.com/originals/77/1a/c0/771ac0e76096a4d8fda9c61b1c07cee9.jpg",
//     "https://i.pinimg.com/originals/f9/85/73/f98573638fe0cc9297f8542726ff70f3.png",
//     "https://i.pinimg.com/originals/14/e1/c3/14e1c374d77dc10fc24e29003239258e.jpg",
//     "https://i.pinimg.com/originals/84/10/c2/8410c277653a3948cce7720523b3d769.jpg",
//     "https://i.pinimg.com/originals/8d/b0/27/8db027695207f8facc418ee73f72d5de.jpg",
//     "https://i.pinimg.com/originals/f0/c2/85/f0c28502c20287e55921404168adbc00.jpg",
//     "https://i.pinimg.com/originals/e4/da/87/e4da87996853a5a41a0c7fe595435f63.png",
//     "https://i.pinimg.com/originals/89/64/63/8964632bac6237d4487fc578be399504.jpg",
//     "https://i.pinimg.com/originals/89/d1/98/89d198559484484db39f3b1f49ed8c28.png",
//     "https://i.pinimg.com/originals/96/87/ef/9687efbbdc26d8984624f2e0b04f9e6b.jpg",
//     "https://i.pinimg.com/originals/4d/fe/71/4dfe71f5e7f244ec33dfec286e561ffa.jpg",
//     "https://i.pinimg.com/originals/ce/e8/55/cee8550e75011e3d10769151786d4c16.jpg",
//     "https://i.pinimg.com/originals/ce/0e/ae/ce0eae91c2984e432bc8441a2ede05eb.jpg",
//     "https://i.pinimg.com/originals/b0/48/42/b04842f8990a552164c2e147846545fa.jpg",
//     "https://i.pinimg.com/originals/fd/48/23/fd48233d096efb7cbbeacc331baa639f.jpg",
//     "https://i.pinimg.com/originals/6e/b1/c1/6eb1c17b7080e645d0348e4a19cdcaa3.jpg",
//     "https://i.pinimg.com/originals/93/14/8e/93148eef1aa3fc9391a4159339162f9c.jpg",
//     "https://i.pinimg.com/236x/f2/64/97/f26497e2c1024f883631ce67e700c133.jpg",
//     "https://i.pinimg.com/originals/67/d5/be/67d5be85a24aa1540fbbcd92d4eb643c.jpg",
//     "https://i.pinimg.com/originals/f6/e2/33/f6e23376d7b972fdac9cde07696f51f9.jpg",
//     "https://i.pinimg.com/originals/16/7f/c5/167fc5b77e60121e4b08e84fad50c456.jpg",
//     "https://i.pinimg.com/originals/7d/49/ec/7d49ec6328450b45dacf6858b1c72d89.jpg",
//     "https://i.pinimg.com/originals/17/27/b5/1727b586906f5501f41c07240e08ee94.jpg",
//     "https://i.pinimg.com/originals/fa/84/57/fa8457ccfd1e7eee307e57ded6f001f8.png",
//     "https://i.pinimg.com/originals/6f/24/47/6f244744196d41bd154209c55f8a4ea0.jpg",
//     "https://i.pinimg.com/originals/79/d6/94/79d694c587df406921af864aa6f733a5.png",
//     "https://i.pinimg.com/originals/4a/6c/06/4a6c06c18f925059fc493e4bdfbfb890.png",
//     "https://i.pinimg.com/originals/45/65/1a/45651a357ea57f2a0812145b8a68503c.png",
//     "https://i.pinimg.com/originals/7b/e0/ee/7be0ee644e16668d273d269178cf368c.jpg",
//     "https://i.pinimg.com/originals/bb/0f/50/bb0f50e24a6b4e4fb447b12b682e0559.jpg",
//     "https://i.pinimg.com/originals/d2/aa/19/d2aa195e97b555a701cb589f9766b637.jpg",
//     "https://i.pinimg.com/originals/2d/b1/26/2db126bb5112f9d42c4c7a2c26d47ca9.jpg",
//     "https://i.pinimg.com/originals/55/c1/83/55c183b614eb5d31b194bc639f34d566.jpg",
//     "https://i.pinimg.com/originals/da/f6/1d/daf61d06219d5b15ea3a9086eed587af.jpg",
//     "https://i.pinimg.com/originals/e3/f2/45/e3f245f182e1646b2d32a2006f4579c2.jpg",
//     "https://i.pinimg.com/originals/e2/33/99/e2339969809295bb5e8e63d4cd167d90.jpg",
//     "https://i.pinimg.com/originals/d9/5c/60/d95c60db15413b37c32c6e1ab39cdb77.jpg",
//     "https://i.pinimg.com/originals/e3/cc/57/e3cc575021a44f31fc83f477385a8e9d.jpg",
//     "https://i.pinimg.com/originals/f1/63/45/f163451e5b2f3f2b9d73804e71f870cf.jpg",
//     "https://i.pinimg.com/originals/ad/dd/5d/addd5dabd49b1419f12a0ea0bb4515cd.jpg",
//     "https://i.pinimg.com/originals/7e/4b/25/7e4b259c06f7f236ba1d9f6c212ab866.jpg",
//     "https://i.pinimg.com/originals/c6/e1/5c/c6e15c979ba2fdc5e71b661e5c037a75.jpg",
//     "https://i.pinimg.com/originals/36/50/b9/3650b99adc1741e01f5a279751f658f9.jpg",
//     "https://i.pinimg.com/236x/7d/d2/f5/7dd2f57c7548d30f4a88e763129728d7.jpg",
//     "https://i.pinimg.com/originals/2a/af/1a/2aaf1a68b7b6fbc61d0c3315efbc01c9.png",
//     "https://i.pinimg.com/originals/02/4d/ef/024defc40c2c6a2c35d80074c3690bd4.jpg",
//     "https://i.pinimg.com/originals/16/1b/00/161b00501cce508b21ec23757eb8d4ad.jpg",
//     "https://i.pinimg.com/originals/bd/6d/45/bd6d45fb0e7dd47dca570424fad19d13.jpg",
//     "https://i.pinimg.com/originals/87/97/da/8797da3af9272cf242c7699ce56aa674.jpg",
//     "https://i.pinimg.com/originals/a8/2c/03/a82c0360b81ee471f5df53f038d3c6eb.png",
//     "https://i.pinimg.com/originals/c8/36/d1/c836d144c52443e9a00afe7de09e0708.jpg",
//     "https://i.pinimg.com/originals/92/78/53/9278537f0334e9f565f2a4947fb8ea8b.jpg",
//     "https://i.pinimg.com/originals/a6/9d/4a/a69d4ab66ba1fef49b8ac9fbfa7c76f4.jpg",
//     "https://i.pinimg.com/originals/a2/83/85/a2838567a1525088957d336b8a070079.jpg",
//     "https://i.pinimg.com/originals/5e/3b/de/5e3bdeb8d4f64077c75984eb34319c33.jpg",
//     "https://i.pinimg.com/originals/44/0e/8a/440e8a7252a8e793379676a9d35c3cb7.png",
//     "https://i.pinimg.com/736x/6b/b1/b3/6bb1b326a41416d96b3453ed263bdc3e.jpg",
//     "https://i.pinimg.com/originals/54/1a/1d/541a1d8396853944659f6a2a1cf5c91c.jpg",
//     "https://i.pinimg.com/originals/a9/3a/05/a93a05a3f06f60f131e7ba1e55079e16.webp",
//     "https://i.pinimg.com/originals/e0/1b/93/e01b93db22139af887098c348908dbcd.jpg",
//     "https://i.pinimg.com/originals/04/18/c0/0418c0fbde75ea73c4b5ce3a874b8e83.png",
//     "https://i.pinimg.com/originals/34/c3/c7/34c3c711dfc06157b97f933c1a0269bb.png",
//     "https://i.pinimg.com/originals/e5/36/cd/e536cd56e2212c5fdb6d3db9a554d559.jpg",
//     "https://i.pinimg.com/originals/f6/21/00/f6210067b44dd0a7c0b4bba9eecc6069.jpg",
//     "https://i.pinimg.com/originals/b6/8c/41/b68c4100e4fc3869f5db545157111a26.png",
//     "https://i.pinimg.com/originals/ac/90/0d/ac900d70909e4cf04f054722568cbe1c.jpg",
//     "https://i.pinimg.com/originals/b6/87/28/b687281ff1408b2f0af8ecbd7596a63b.png",
//     "https://i.pinimg.com/originals/ea/42/85/ea4285d0c24a20306d6b38fefe076572.png",
//     "https://i.pinimg.com/originals/a7/1d/0d/a71d0d6f8b9bf7b6b9d7aa8ed7bffb07.jpg",
//     "https://i.pinimg.com/originals/df/72/c7/df72c788cbac6db8d5df7a90dbe019bc.jpg",
//     "https://i.pinimg.com/originals/e9/ea/ae/e9eaaeb928f15315da427445058a29f8.jpg",
//     "https://i.pinimg.com/originals/99/a3/52/99a3526454ce3aaf8f15e9fc72070349.jpg",
//     "https://i.pinimg.com/originals/05/3b/1e/053b1e0b52f64015980fb09cdbad2835.png",
//     "https://i.pinimg.com/originals/83/e7/9b/83e79be538ac6b2b7b59f2b4f412cfef.jpg",
//     "https://i.pinimg.com/originals/91/9b/3e/919b3e2031e9de18c89bb0e8906213a0.jpg",
//     "https://i.pinimg.com/originals/9b/67/b5/9b67b5d3275ee0c2c5c459ec0bd7e027.jpg",
//     "https://i.pinimg.com/originals/70/8b/17/708b179b3ad873e31309dd6bb57b4730.jpg",
//     "https://i.pinimg.com/originals/7d/99/42/7d99426018df94f36384a039bfb16a90.jpg",
//     "https://i.pinimg.com/originals/3f/7f/38/3f7f3822dccb5af9a724dcef9a9bd4a2.jpg",
//     "https://i.pinimg.com/originals/e8/4c/32/e84c328b197e7942abbc8eace6c92da0.png",
//     "https://i.pinimg.com/736x/aa/91/7d/aa917d72e3c5317e8a175cf1ceb6e420.jpg",
//     "https://i.pinimg.com/originals/70/59/97/7059971a9fbfea03c7f8d23dc1ddab87.png",
//     "https://i.pinimg.com/originals/99/53/49/995349eff0c5f5b41c9091fdd4d16d81.jpg",
//     "https://i.pinimg.com/originals/58/df/89/58df89c773a5a0c88dec29db8fde3009.jpg",
//     "https://i.pinimg.com/originals/68/c6/be/68c6bed962a7e7f0b7afb0e3f8aaa41f.jpg",
//     "https://i.pinimg.com/originals/26/55/3b/26553bd52fa532a16a4b6f2b89b9824d.jpg",
//     "https://i.pinimg.com/originals/1f/40/32/1f4032cf0fbfd08343b678743af17819.jpg",
//     "https://i.pinimg.com/originals/2e/e7/a9/2ee7a91fd832dfdf62769bebe48a0aae.png",
//     "https://i.pinimg.com/originals/bd/23/f6/bd23f6b7b2a9e41a3d3a3ec74c3f9b50.png",
//     "https://i.pinimg.com/originals/21/ce/ef/21ceeffe84306bd024c3cee662622754.jpg",
//     "https://i.pinimg.com/originals/59/10/e6/5910e6aaa44e56148bd6acd507bfd999.png",
//     "https://i.pinimg.com/originals/f4/74/ce/f474ce8c823c940c48c1cdba1cfa9109.jpg",
//     "https://i.pinimg.com/originals/5a/81/3c/5a813c212d0a6703348a5db770f6ba89.jpg",
//     "https://i.pinimg.com/originals/7d/a5/a9/7da5a9c197d50f1f793338198c5d4358.jpg",
//     "https://i.pinimg.com/originals/0f/7f/c4/0f7fc4cc1367e89de9e3e1091be75618.jpg",
//     "https://i.pinimg.com/originals/b3/44/1d/b3441d4012ba9fdbcb3f160de3032bd5.jpg",
//     "https://i.pinimg.com/originals/fa/67/4e/fa674ee713381e8dee5f50672a8b19d7.png",
//     "https://i.pinimg.com/originals/37/3f/8c/373f8c14c68c1a9eadf0649490cd19ed.jpg",
//     "https://i.pinimg.com/originals/56/16/58/5616588d1c2438f6c07679040cbf217a.jpg",
//     "https://i.pinimg.com/originals/ab/20/34/ab2034bdf68ceea177b5b2ce5e3ec39c.jpg",
//     "https://i.pinimg.com/originals/9c/cb/11/9ccb11fa2b8a299516854f4a13a64a61.jpg",
//     "https://i.pinimg.com/originals/bd/49/8a/bd498aaa6d541d61a09009e7b90034a3.jpg",
//     "https://i.pinimg.com/736x/f1/a9/c5/f1a9c539f31bf1887506e2b1f0b0f837.jpg",
//     "https://i.pinimg.com/originals/f6/3f/ee/f63fee39484283cb1563e60f1387bcd1.jpg",
//     "https://i.pinimg.com/originals/55/ca/ca/55cacadac39ee493eb4ade6d637ac485.jpg",
//     "https://i.pinimg.com/originals/b7/2c/a7/b72ca7c95f70d64cbc7bce8c3e3ec363.png",
//     "https://i.pinimg.com/originals/46/2d/69/462d692940c281289a119d1ab79e2a13.jpg",
//     "https://i.pinimg.com/originals/e2/7c/51/e27c518712656cc690bb695c6300f5ac.jpg",
//     "https://i.pinimg.com/originals/64/a2/e4/64a2e468ce32940fa6340420d5739fd2.jpg",
//     "https://i.pinimg.com/originals/86/4a/7e/864a7e89270c61009861533031934ed5.jpg",
//     "https://i.pinimg.com/originals/f8/61/14/f86114d49824459ca234943cca45f7d6.png",
//     "https://i.pinimg.com/originals/62/78/23/627823380508654b19b338172547140b.jpg",
//     "https://i.pinimg.com/originals/87/19/4a/87194aa58933f49de8f61b3574e53017.jpg",
//     "https://i.pinimg.com/originals/95/dc/61/95dc61ac66034f78a61c7ab4ee8c2830.jpg",
//     "https://i.pinimg.com/originals/39/96/71/399671cad6a472bc1ddf46a976ccc63f.jpg",
//     "https://i.pinimg.com/originals/a3/35/80/a3358043e16fac086618faa25ca9a56b.jpg",
//     "https://i.pinimg.com/originals/1f/51/f2/1f51f209b85d771e1e59d244dee203c4.jpg",
//     "https://i.pinimg.com/originals/eb/54/74/eb5474c505e76305d680d3e720aef570.jpg",
//     "https://i.pinimg.com/originals/aa/36/76/aa36763b11782f44ac990be57977e540.jpg",
//     "https://i.pinimg.com/originals/b1/3c/2f/b13c2ff213c7ffda5b34dc57d489202a.jpg",
//     "https://i.pinimg.com/originals/44/fd/01/44fd01ea1965f0452eee96cf16520d65.jpg",
//     "https://i.pinimg.com/originals/22/f3/da/22f3da0b8d766b48592e3f876bde4ed4.jpg",
//     "https://i.pinimg.com/originals/3f/72/25/3f7225c932a9d397cd1c08d95d97749a.jpg",
//     "https://i.pinimg.com/originals/b7/92/04/b792043c349069af445de96867bd53dd.jpg",
//     "https://i.pinimg.com/originals/0c/95/7b/0c957bdbc2f35ad9b03006b803d8f8d4.jpg",
//     "https://i.pinimg.com/originals/97/f2/4c/97f24c768fb94e27702bf479cca994e3.jpg",
//     "https://i.pinimg.com/originals/c4/c9/fd/c4c9fd302d1c9cd808070802c091b5d1.png",
//     "https://i.pinimg.com/originals/ac/bc/38/acbc38a372c54a478232b3c679bacafa.jpg",
//     "https://i.pinimg.com/originals/27/ad/30/27ad30904368f7adf8f859249753ad6f.jpg",
//     "https://i.pinimg.com/originals/5a/3a/a5/5a3aa5b87baa43a341fda283d27c9fd9.jpg",
//     "https://i.pinimg.com/originals/82/22/a7/8222a70fb2a27a9fe16986daf6b74978.jpg",
//     "https://i.pinimg.com/originals/ee/bf/b9/eebfb9c386a0625e2263dccbfe80aedf.png",
//     "https://i.pinimg.com/originals/02/60/f0/0260f0bd7de1b88d3667270d3fd7e4a3.png",
//     "https://i.pinimg.com/originals/70/4d/41/704d416bf59d84dbc05f5c3753b5a760.jpg",
//     "https://i.pinimg.com/originals/b5/8f/23/b58f2334f43d274b0c9c3e886898ff2d.jpg",
//     "https://i.pinimg.com/originals/d9/4e/00/d94e007d81d1175ca5f4d4d7b3a8d6b6.jpg",
//     "https://i.pinimg.com/originals/e9/dd/75/e9dd757e7ea9fe9190863c5a7242ca69.jpg",
//     "https://i.pinimg.com/originals/04/b2/ae/04b2ae084f22aee49deebd494d48a5b0.jpg",
//     "https://i.pinimg.com/originals/ab/bd/81/abbd819437a83b78e19a784b6412c357.jpg",
//     "https://i.pinimg.com/originals/76/7d/c7/767dc74ecb58d2cb9a117b50c5ff84ab.jpg",
//     "https://i.pinimg.com/originals/d0/3c/ad/d03cad6b3b91f50032f2595196b059b5.jpg",
//     "https://i.pinimg.com/originals/fa/2a/43/fa2a43db1490da3ab4ceb40416bf64de.jpg",
//     "https://i.pinimg.com/originals/f1/20/b6/f120b62ed9a4cfe43fe70e91cd1ca5fe.jpg",
//     "https://i.pinimg.com/originals/f8/db/8c/f8db8c3dbb9f868c554ac1241257b21e.jpg",
//     "https://i.pinimg.com/originals/be/a9/87/bea987d8865187f377004b2c0e7c82fd.jpg",
//     "https://i.pinimg.com/originals/e8/7d/e7/e87de7143857b73493220381664cc1ea.jpg",
//     "https://i.pinimg.com/originals/b8/6a/5e/b86a5ebd4de66fe180323035025532f4.jpg",
//     "https://i.pinimg.com/originals/27/f4/09/27f40912ac67842d64b6c3e9638598f6.jpg",
//     "https://i.pinimg.com/originals/f9/50/a3/f950a3ffd621e46a6c3972831306e5fa.jpg",
//     "https://i.pinimg.com/originals/c6/b4/20/c6b4200bfe41f29f1e3c56467c0a7b91.jpg",
//     "https://i.pinimg.com/originals/d5/7b/8a/d57b8ad66dddac6b10446c9f39988695.jpg",
//     "https://i.pinimg.com/originals/94/8c/68/948c68024c02fa06fa9c8c45b551d6a0.jpg",
//     "https://i.pinimg.com/originals/d5/19/21/d519215532848b850bbdfa1d8c4fc895.gif",
//     "https://i.pinimg.com/originals/21/f2/5c/21f25c18cbc71486b9e198292e905548.jpg",
//     "https://i.pinimg.com/originals/7a/c0/ab/7ac0ab68bb4a89d3c99010e27bd0f3b5.jpg",
//     "https://i.pinimg.com/originals/16/c9/ee/16c9ee09033f272d54feaac436fd552c.jpg",
//     "https://i.pinimg.com/originals/5c/cc/21/5ccc21fd215a03f94d7d9ee9d1dff2b3.jpg",
//     "https://i.pinimg.com/originals/31/30/88/313088c160b9aaec60cf921ab1c336e2.jpg",
//     "https://i.pinimg.com/originals/a0/c5/a8/a0c5a8fefb0aa77710b6361cebc72dc7.jpg",
//     "https://i.pinimg.com/originals/8b/95/d5/8b95d588c75e20972c33a3d80870d7f2.jpg",
//     "https://i.pinimg.com/originals/6d/ba/45/6dba458ab2eb233193ee702e27d59031.jpg",
//     "https://i.pinimg.com/originals/c4/d7/6c/c4d76cdea0b7a2e8dae1636f63280f87.png",
//     "https://i.pinimg.com/originals/a7/03/b2/a703b2f8f6d4f70246b5a5755de6ad78.jpg",
//     "https://i.pinimg.com/originals/e6/0a/ea/e60aea074f904caa1ead4ab8687b82d3.png",
//     "https://i.pinimg.com/originals/8f/81/2b/8f812b5824d75f0a09527633590a5d5f.jpg",
//     "https://i.pinimg.com/736x/1b/39/17/1b391722694c48e03edd00978bc234ee.jpg",
//     "https://i.pinimg.com/736x/23/38/4c/23384ccbd5d4727dc0e91621aea2fe68.jpg",
//     "https://i.pinimg.com/originals/d1/89/7b/d1897b98a8623c8f8abfbb3a2718052f.jpg",
//     "https://i.pinimg.com/originals/73/e6/f6/73e6f629ed793c25a17f5ed0039ac456.jpg",
//     "https://i.pinimg.com/originals/71/55/fc/7155fc9247ae551c33a9f4fa4a9f5b4e.jpg",
//     "https://i.pinimg.com/originals/b2/51/12/b2511239ceb5aaf85628f8acc929f72c.png",
//     "https://i.pinimg.com/originals/51/e8/5a/51e85a5a398798a8d3c5c6aeca3fbe25.jpg",
//     "https://i.pinimg.com/736x/b3/43/41/b34341aca7ae1e16bec7638009e19376.jpg",
//     "https://i.pinimg.com/originals/1a/07/e4/1a07e4930a2fa15cdd840942d4335288.jpg",
//     "https://i.pinimg.com/originals/9d/d9/2d/9dd92da423faf84cf976a0faa87c328b.jpg",
//     "https://i.pinimg.com/originals/6e/95/c6/6e95c67ec97f87f85f7eafb3a6efbefa.jpg",
//     "https://i.pinimg.com/originals/58/c3/e8/58c3e8b682f8a7caf29f0263d549e354.jpg",
//     "https://i.pinimg.com/originals/c6/5e/f0/c65ef07d0a3352397302a4f7093c494c.jpg",
//     "https://i.pinimg.com/vwebp/474x/92/dc/1d/92dc1dbe1634fc5936afb0da8842c412.webp",
//     "https://i.pinimg.com/originals/b2/60/d7/b260d76893533994b74fa65a44649232.jpg",
//     "https://i.pinimg.com/originals/5e/86/a0/5e86a0a5e5fef77db20248bfb576a652.jpg",
//     "https://i.pinimg.com/originals/e3/ff/59/e3ff593a7a4ce579842ac3875ba861cc.jpg",
//     "https://i.pinimg.com/originals/3f/43/74/3f43744fb91aae5881d0be1727989453.jpg",
//     "https://i.pinimg.com/originals/30/5f/d7/305fd7d29647445585e51d05e4cbb7d0.jpg",
//     "https://i.pinimg.com/originals/1d/bc/eb/1dbceb31a56ccc6c2a8cd69ed2fbe126.jpg",
//     "https://i.pinimg.com/originals/09/63/3e/09633ea79973fa88d35445a2103edaea.jpg",
//     "https://i.pinimg.com/originals/e8/12/c5/e812c5346c69f143d25ef93ee4411d6b.jpg",
//     "https://i.pinimg.com/originals/1f/be/73/1fbe73ce10dc41eba72e6d810b9bc4be.jpg",
//     "https://i.pinimg.com/originals/7c/68/bd/7c68bdeb32170cee7c89bfae1097baf0.jpg",
//     "https://i.pinimg.com/originals/83/47/2d/83472d633c6655700ae81b1604e23df8.jpg",
//     "https://i.pinimg.com/originals/10/00/66/1000667c4d46640914728dd1696b5778.jpg",
//     "https://i.pinimg.com/originals/e9/39/7a/e9397a4af6c831b133f3843617934f97.jpg",
//     "https://i.pinimg.com/originals/cd/da/45/cdda452fa749d297139e37f6fff1e772.jpg",
//     "https://i.pinimg.com/originals/fc/c3/48/fcc3480c8f9f345ccb52842ce5aeae64.jpg"
// ];

// // =============================================================================
// // 200 real / real-looking book catalog seeds
// // =============================================================================

// type SeedBook = {
//     title: string;
//     titleVi?: string;
//     author: string;
//     publisher: string;
//     isbn13: string;
//     publicationYear: number;
//     pageCount: number;
//     categorySlugs: string[];
//     priceVnd: number;
//     descriptionVi: string;
//     descriptionEn: string;
// };

// const BOOKS: SeedBook[] = [
//     // ===================== Programming / Software Architecture / DevOps / Cybersecurity / Data & AI =====================
//     { title: 'Clean Code', author: 'Robert C. Martin', publisher: 'Prentice Hall', isbn13: '9780132350884', publicationYear: 2008, pageCount: 464, categorySlugs: ['programming'], priceVnd: 320000, descriptionVi: 'Cuốn sách kinh điển về viết mã sạch, dễ đọc và dễ bảo trì, được nhiều kỹ sư phần mềm coi là sách nhập môn bắt buộc.', descriptionEn: 'A classic guide to writing readable, maintainable code, widely considered required reading for software engineers.' },
//     { title: 'The Pragmatic Programmer', author: 'David Thomas, Andrew Hunt', publisher: 'Addison-Wesley', isbn13: '9780135957059', publicationYear: 2019, pageCount: 352, categorySlugs: ['programming'], priceVnd: 350000, descriptionVi: 'Bộ nguyên tắc và thói quen thực hành giúp lập trình viên trở nên chuyên nghiệp và hiệu quả hơn.', descriptionEn: 'A set of practical principles and habits to help developers become more effective and professional.' },
//     { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', publisher: 'Addison-Wesley', isbn13: '9780201633610', publicationYear: 1994, pageCount: 395, categorySlugs: ['software-architecture', 'programming'], priceVnd: 380000, descriptionVi: 'Tác phẩm nền tảng giới thiệu 23 mẫu thiết kế hướng đối tượng kinh điển.', descriptionEn: 'The foundational text introducing 23 classic object-oriented design patterns.' },
//     { title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', publisher: 'Addison-Wesley', isbn13: '9780134757599', publicationYear: 2018, pageCount: 448, categorySlugs: ['programming', 'software-architecture'], priceVnd: 360000, descriptionVi: 'Hướng dẫn từng bước để cải thiện cấu trúc mã nguồn mà không thay đổi hành vi của nó.', descriptionEn: 'A step-by-step guide to improving code structure without changing its external behavior.' },
//     { title: 'Clean Architecture', author: 'Robert C. Martin', publisher: 'Prentice Hall', isbn13: '9780134494166', publicationYear: 2017, pageCount: 432, categorySlugs: ['software-architecture'], priceVnd: 340000, descriptionVi: 'Nguyên lý thiết kế kiến trúc phần mềm giúp hệ thống dễ mở rộng và bảo trì lâu dài.', descriptionEn: 'Design principles for software architecture that keep systems flexible and maintainable over time.' },
//     { title: 'Building Microservices', author: 'Sam Newman', publisher: "O'Reilly Media", isbn13: '9781492034025', publicationYear: 2021, pageCount: 600, categorySlugs: ['software-architecture', 'devops-cloud'], priceVnd: 420000, descriptionVi: 'Hướng dẫn toàn diện về thiết kế, triển khai và vận hành hệ thống microservices.', descriptionEn: 'A comprehensive guide to designing, deploying, and operating microservices-based systems.' },
//     { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', publisher: "O'Reilly Media", isbn13: '9781449373320', publicationYear: 2017, pageCount: 616, categorySlugs: ['software-architecture', 'data-ai'], priceVnd: 450000, descriptionVi: 'Phân tích sâu về các hệ thống dữ liệu phân tán, độ tin cậy và khả năng mở rộng.', descriptionEn: 'A deep dive into distributed data systems, reliability, and scalability trade-offs.' },
//     { title: 'The Phoenix Project', author: 'Gene Kim, Kevin Behr, George Spafford', publisher: 'IT Revolution Press', isbn13: '9780988262591', publicationYear: 2013, pageCount: 432, categorySlugs: ['devops-cloud', 'management-leadership'], priceVnd: 280000, descriptionVi: 'Tiểu thuyết kinh doanh về chuyển đổi IT, giúp người đọc hiểu trực quan về DevOps.', descriptionEn: 'A business novel about IT transformation that makes DevOps principles intuitive.' },
//     { title: 'The DevOps Handbook', author: 'Gene Kim, Jez Humble, Patrick Debois, John Willis', publisher: 'IT Revolution Press', isbn13: '9781942788003', publicationYear: 2016, pageCount: 480, categorySlugs: ['devops-cloud'], priceVnd: 390000, descriptionVi: 'Hướng dẫn thực hành để xây dựng văn hóa DevOps và cải thiện tốc độ triển khai.', descriptionEn: 'A practical guide to building DevOps culture and improving deployment velocity.' },
//     { title: 'Kubernetes Up and Running', author: 'Kelsey Hightower, Brendan Burns, Joe Beda', publisher: "O'Reilly Media", isbn13: '9781492046530', publicationYear: 2019, pageCount: 277, categorySlugs: ['devops-cloud'], priceVnd: 410000, descriptionVi: 'Giới thiệu thực tiễn về cách triển khai và quản lý ứng dụng trên Kubernetes.', descriptionEn: 'A hands-on introduction to deploying and managing applications on Kubernetes.' },
//     { title: 'Site Reliability Engineering', author: 'Niall Richard Murphy, Betsy Beyer, Chris Jones, Jennifer Petoff', publisher: "O'Reilly Media", isbn13: '9781491929124', publicationYear: 2016, pageCount: 552, categorySlugs: ['devops-cloud', 'software-architecture'], priceVnd: 430000, descriptionVi: 'Cách Google vận hành hệ thống quy mô lớn với độ tin cậy cao thông qua kỹ thuật SRE.', descriptionEn: "How Google runs large-scale systems reliably through site reliability engineering practices." },
//     { title: 'The Web Application Hacker\u2019s Handbook', author: 'Dafydd Stuttard, Marcus Pinto', publisher: 'Wiley', isbn13: '9781118026472', publicationYear: 2011, pageCount: 912, categorySlugs: ['cybersecurity'], priceVnd: 480000, descriptionVi: 'Cẩm nang chi tiết về cách phát hiện và khai thác lỗ hổng trong ứng dụng web.', descriptionEn: 'A detailed manual on discovering and exploiting security flaws in web applications.' },
//     { title: 'Hacking: The Art of Exploitation', author: 'Jon Erickson', publisher: 'No Starch Press', isbn13: '9781593271442', publicationYear: 2008, pageCount: 488, categorySlugs: ['cybersecurity'], priceVnd: 350000, descriptionVi: 'Giải thích các kỹ thuật hacking từ góc độ lập trình hệ thống và bảo mật mạng.', descriptionEn: 'Explains hacking techniques from the perspective of systems programming and network security.' },
//     { title: 'Applied Cryptography', author: 'Bruce Schneier', publisher: 'Wiley', isbn13: '9781119096726', publicationYear: 2015, pageCount: 784, categorySlugs: ['cybersecurity'], priceVnd: 460000, descriptionVi: 'Tài liệu tham khảo toàn diện về các thuật toán và giao thức mật mã ứng dụng.', descriptionEn: 'A comprehensive reference on applied cryptographic algorithms and protocols.' },
//     { title: 'Python for Data Analysis', author: 'Wes McKinney', publisher: "O'Reilly Media", isbn13: '9781491957660', publicationYear: 2017, pageCount: 550, categorySlugs: ['data-ai', 'programming'], priceVnd: 400000, descriptionVi: 'Hướng dẫn dùng Python và pandas để xử lý, phân tích dữ liệu hiệu quả.', descriptionEn: 'A guide to using Python and pandas for effective data wrangling and analysis.' },
//     { title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow', author: 'Aurélien Géron', publisher: "O'Reilly Media", isbn13: '9781492032649', publicationYear: 2019, pageCount: 819, categorySlugs: ['data-ai'], priceVnd: 470000, descriptionVi: 'Hướng dẫn thực hành xây dựng các mô hình machine learning từ cơ bản đến nâng cao.', descriptionEn: 'A hands-on guide to building machine learning models from fundamentals to advanced topics.' },
//     { title: 'Deep Learning', author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville', publisher: 'MIT Press', isbn13: '9780262035613', publicationYear: 2016, pageCount: 800, categorySlugs: ['data-ai'], priceVnd: 520000, descriptionVi: 'Giáo trình nền tảng toàn diện về deep learning được viết bởi các chuyên gia hàng đầu.', descriptionEn: 'A comprehensive foundational textbook on deep learning written by leading researchers.' },
//     { title: 'Storytelling with Data', author: 'Cole Nussbaumer Knaflic', publisher: 'Wiley', isbn13: '9781119002253', publicationYear: 2015, pageCount: 288, categorySlugs: ['data-ai', 'business-economics'], priceVnd: 310000, descriptionVi: 'Hướng dẫn trình bày dữ liệu rõ ràng, thuyết phục để hỗ trợ ra quyết định.', descriptionEn: 'A guide to presenting data clearly and persuasively to support decision-making.' },
//     { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', publisher: 'MIT Press', isbn13: '9780262046305', publicationYear: 2022, pageCount: 1312, categorySlugs: ['programming', 'data-ai'], priceVnd: 550000, descriptionVi: 'Giáo trình thuật toán kinh điển được sử dụng rộng rãi trong các trường đại học.', descriptionEn: 'The classic algorithms textbook used widely across university computer science programs.' },
//     { title: 'You Don\u2019t Know JS Yet', author: 'Kyle Simpson', publisher: 'Independently Published', isbn13: '9798602477429', publicationYear: 2020, pageCount: 278, categorySlugs: ['programming'], priceVnd: 220000, descriptionVi: 'Khám phá những góc khó hiểu nhưng quan trọng của ngôn ngữ JavaScript.', descriptionEn: 'Explores the tricky but important parts of the JavaScript language in depth.' },
//     { title: 'Database Internals', author: 'Alex Petrov', publisher: "O'Reilly Media", isbn13: '9781492040347', publicationYear: 2019, pageCount: 376, categorySlugs: ['data-ai', 'software-architecture'], priceVnd: 420000, descriptionVi: 'Giải thích cách các hệ quản trị cơ sở dữ liệu phân tán hoạt động bên trong.', descriptionEn: 'Explains how distributed database systems work under the hood.' },

//     // ===================== Business & Economics / Entrepreneurship / Management / Marketing / Finance =====================
//     { title: 'The Lean Startup', author: 'Eric Ries', publisher: 'Crown Business', isbn13: '9780307887894', publicationYear: 2011, pageCount: 336, categorySlugs: ['entrepreneurship', 'business-economics'], priceVnd: 250000, descriptionVi: 'Phương pháp khởi nghiệp tinh gọn giúp doanh nghiệp kiểm chứng ý tưởng nhanh và hiệu quả.', descriptionEn: 'A lean methodology for startups to validate ideas quickly and efficiently.' },
//     { title: 'Zero to One', author: 'Peter Thiel, Blake Masters', publisher: 'Crown Business', isbn13: '9780804139298', publicationYear: 2014, pageCount: 224, categorySlugs: ['entrepreneurship'], priceVnd: 230000, descriptionVi: 'Quan điểm độc đáo về cách xây dựng doanh nghiệp tạo ra giá trị đột phá.', descriptionEn: 'A distinctive perspective on building companies that create breakthrough value.' },
//     { title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', publisher: 'Harper Business', isbn13: '9780062273208', publicationYear: 2014, pageCount: 304, categorySlugs: ['entrepreneurship', 'management-leadership'], priceVnd: 260000, descriptionVi: 'Những bài học thực tế và khó khăn nhất trong quá trình xây dựng và điều hành công ty.', descriptionEn: 'Hard-won lessons about the most difficult parts of building and running a company.' },
//     { title: 'Good to Great', author: 'Jim Collins', publisher: 'HarperBusiness', isbn13: '9780066620992', publicationYear: 2001, pageCount: 320, categorySlugs: ['management-leadership', 'business-economics'], priceVnd: 270000, descriptionVi: 'Nghiên cứu về điều gì giúp một số công ty chuyển từ tốt sang vĩ đại.', descriptionEn: 'A research-driven look at what makes some companies leap from good to great.' },
//     { title: 'The Innovator\u2019s Dilemma', author: 'Clayton M. Christensen', publisher: 'Harvard Business Review Press', isbn13: '9781633691780', publicationYear: 2016, pageCount: 286, categorySlugs: ['business-economics', 'management-leadership'], priceVnd: 290000, descriptionVi: 'Lý thuyết về đổi mới gây gián đoạn và lý do các công ty dẫn đầu thất bại.', descriptionEn: 'A theory of disruptive innovation explaining why leading companies fail.' },
//     { title: 'Measure What Matters', author: 'John Doerr', publisher: 'Portfolio', isbn13: '9780525536222', publicationYear: 2018, pageCount: 320, categorySlugs: ['management-leadership', 'business-economics'], priceVnd: 280000, descriptionVi: 'Phương pháp OKR giúp doanh nghiệp đặt mục tiêu và đo lường kết quả hiệu quả.', descriptionEn: 'The OKR methodology for setting goals and measuring results effectively.' },
//     { title: 'Radical Candor', author: 'Kim Scott', publisher: "St. Martin's Press", isbn13: '9781250103505', publicationYear: 2017, pageCount: 320, categorySlugs: ['management-leadership', 'communication'], priceVnd: 260000, descriptionVi: 'Cách lãnh đạo hiệu quả bằng sự quan tâm cá nhân kết hợp phản hồi thẳng thắn.', descriptionEn: 'How to lead effectively by combining personal care with direct feedback.' },
//     { title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni', publisher: 'Jossey-Bass', isbn13: '9780787960759', publicationYear: 2002, pageCount: 229, categorySlugs: ['management-leadership'], priceVnd: 220000, descriptionVi: 'Mô hình giải thích nguyên nhân gốc rễ khiến các nhóm làm việc không hiệu quả.', descriptionEn: 'A model explaining the root causes behind dysfunctional team performance.' },
//     { title: 'Crossing the Chasm', author: 'Geoffrey A. Moore', publisher: 'Harper Business', isbn13: '9780062292988', publicationYear: 2014, pageCount: 254, categorySlugs: ['marketing-sales', 'entrepreneurship'], priceVnd: 260000, descriptionVi: 'Chiến lược tiếp thị sản phẩm công nghệ cho thị trường đại chúng.', descriptionEn: 'A marketing strategy for taking technology products into the mainstream market.' },
//     { title: 'Influence: The Psychology of Persuasion', author: 'Robert B. Cialdini', publisher: 'Harper Business', isbn13: '9780061241895', publicationYear: 2006, pageCount: 336, categorySlugs: ['marketing-sales', 'psychology'], priceVnd: 240000, descriptionVi: 'Khám phá sáu nguyên tắc tâm lý ảnh hưởng đến quyết định và hành vi con người.', descriptionEn: 'Explores six psychological principles that influence human decisions and behavior.' },
//     { title: 'Made to Stick', author: 'Chip Heath, Dan Heath', publisher: 'Random House', isbn13: '9781400064281', publicationYear: 2007, pageCount: 291, categorySlugs: ['marketing-sales', 'communication'], priceVnd: 230000, descriptionVi: 'Lý do tại sao một số ý tưởng tồn tại lâu trong tâm trí còn số khác bị quên lãng.', descriptionEn: 'Why some ideas stick in our minds while others are quickly forgotten.' },
//     { title: 'This Is Marketing', author: 'Seth Godin', publisher: 'Portfolio', isbn13: '9780525540830', publicationYear: 2018, pageCount: 256, categorySlugs: ['marketing-sales'], priceVnd: 220000, descriptionVi: 'Quan điểm hiện đại về tiếp thị tập trung vào việc tạo ra giá trị thực sự cho khách hàng.', descriptionEn: 'A modern view of marketing focused on creating real value for a specific audience.' },
//     { title: 'The Intelligent Investor', author: 'Benjamin Graham', publisher: 'Harper Business', isbn13: '9780060555665', publicationYear: 2006, pageCount: 640, categorySlugs: ['finance-investing'], priceVnd: 300000, descriptionVi: 'Kinh thánh đầu tư giá trị, nền tảng triết lý đầu tư của Warren Buffett.', descriptionEn: 'The bible of value investing that shaped Warren Buffett\u2019s investment philosophy.' },
//     { title: 'Rich Dad Poor Dad', author: 'Robert T. Kiyosaki', publisher: 'Plata Publishing', isbn13: '9781612680194', publicationYear: 2017, pageCount: 258, categorySlugs: ['finance-investing'], priceVnd: 180000, descriptionVi: 'Bài học tài chính cá nhân qua câu chuyện về hai người cha với quan điểm khác nhau.', descriptionEn: 'Personal finance lessons told through the contrasting views of two father figures.' },
//     { title: 'The Psychology of Money', author: 'Morgan Housel', publisher: 'Harriman House', isbn13: '9780857197689', publicationYear: 2020, pageCount: 256, categorySlugs: ['finance-investing', 'psychology'], priceVnd: 210000, descriptionVi: 'Cách hành vi và tâm lý ảnh hưởng đến quyết định tài chính nhiều hơn là kiến thức thuần túy.', descriptionEn: 'How behavior and psychology shape financial decisions more than pure knowledge does.' },
//     { title: 'A Random Walk Down Wall Street', author: 'Burton G. Malkiel', publisher: 'W. W. Norton & Company', isbn13: '9781324051138', publicationYear: 2023, pageCount: 464, categorySlugs: ['finance-investing'], priceVnd: 290000, descriptionVi: 'Phân tích các chiến lược đầu tư và lý do đầu tư chỉ số dài hạn thường hiệu quả.', descriptionEn: 'An analysis of investing strategies and why long-term index investing tends to win.' },
//     { title: 'Principles: Life and Work', author: 'Ray Dalio', publisher: 'Simon & Schuster', isbn13: '9781501124020', publicationYear: 2017, pageCount: 592, categorySlugs: ['business-economics', 'management-leadership'], priceVnd: 320000, descriptionVi: 'Những nguyên tắc sống và làm việc được rút ra từ kinh nghiệm điều hành quỹ đầu tư lớn.', descriptionEn: 'Life and work principles drawn from running one of the world\u2019s largest investment funds.' },

//     // ===================== Psychology / History / Philosophy / Social Issues =====================
//     { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', publisher: 'Farrar, Straus and Giroux', isbn13: '9780374533557', publicationYear: 2013, pageCount: 499, categorySlugs: ['psychology'], priceVnd: 260000, descriptionVi: 'Khám phá hai hệ thống tư duy chi phối cách con người ra quyết định.', descriptionEn: 'Explores the two systems of thought that drive human decision-making.' },
//     { title: 'Atomic Habits', author: 'James Clear', publisher: 'Avery', isbn13: '9780735211292', publicationYear: 2018, pageCount: 320, categorySlugs: ['psychology', 'productivity-learning'], priceVnd: 220000, descriptionVi: 'Phương pháp xây dựng thói quen tốt và loại bỏ thói quen xấu một cách bền vững.', descriptionEn: 'A method for building good habits and breaking bad ones in a sustainable way.' },
//     { title: 'Mindset: The New Psychology of Success', author: 'Carol S. Dweck', publisher: 'Ballantine Books', isbn13: '9780345472328', publicationYear: 2007, pageCount: 320, categorySlugs: ['psychology'], priceVnd: 210000, descriptionVi: 'Phân biệt tư duy cố định và tư duy phát triển, cùng tác động đến thành công.', descriptionEn: 'Distinguishes fixed and growth mindsets and their impact on long-term success.' },
//     { title: 'The Body Keeps the Score', author: 'Bessel van der Kolk', publisher: 'Viking', isbn13: '9780670785933', publicationYear: 2014, pageCount: 464, categorySlugs: ['psychology'], priceVnd: 280000, descriptionVi: 'Nghiên cứu về cách sang chấn tâm lý ảnh hưởng đến cơ thể và tâm trí.', descriptionEn: 'A study of how psychological trauma reshapes both body and mind.' },
//     { title: 'Man\u2019s Search for Meaning', author: 'Viktor E. Frankl', publisher: 'Beacon Press', isbn13: '9780807014295', publicationYear: 2006, pageCount: 184, categorySlugs: ['psychology', 'philosophy'], priceVnd: 150000, descriptionVi: 'Hồi ký và triết lý sống của một bác sĩ tâm lý sống sót qua trại tập trung.', descriptionEn: 'A memoir and philosophy of meaning by a psychiatrist who survived the concentration camps.' },
//     { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', publisher: 'Harper', isbn13: '9780062316097', publicationYear: 2015, pageCount: 464, categorySlugs: ['history', 'mind-society'], priceVnd: 270000, descriptionVi: 'Hành trình lịch sử loài người từ thời kỳ săn bắt hái lượm đến văn minh hiện đại.', descriptionEn: 'A sweeping history of humankind from foraging origins to modern civilization.' },
//     { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', publisher: 'W. W. Norton & Company', isbn13: '9780393317558', publicationYear: 1999, pageCount: 480, categorySlugs: ['history'], priceVnd: 260000, descriptionVi: 'Giải thích vì sao một số nền văn minh phát triển vượt trội hơn các nền văn minh khác.', descriptionEn: 'Explains why some civilizations advanced faster and farther than others.' },
//     { title: 'A People\u2019s History of the United States', author: 'Howard Zinn', publisher: 'Harper Perennial', isbn13: '9780062397348', publicationYear: 2005, pageCount: 729, categorySlugs: ['history', 'social-issues'], priceVnd: 290000, descriptionVi: 'Lịch sử Hoa Kỳ được kể từ góc nhìn của những người dân thường thay vì giới cầm quyền.', descriptionEn: 'American history told from the perspective of ordinary people rather than the powerful.' },
//     { title: 'The Diary of a Young Girl', author: 'Anne Frank', publisher: 'Bantam', isbn13: '9780553296983', publicationYear: 1993, pageCount: 283, categorySlugs: ['history', 'literature-arts'], priceVnd: 150000, descriptionVi: 'Nhật ký chân thực của một thiếu nữ Do Thái trong thời kỳ Thế chiến thứ hai.', descriptionEn: 'The poignant diary of a young Jewish girl in hiding during World War II.' },
//     { title: 'Meditations', author: 'Marcus Aurelius', publisher: 'Modern Library', isbn13: '9780812968255', publicationYear: 2003, pageCount: 304, categorySlugs: ['philosophy'], priceVnd: 160000, descriptionVi: 'Suy ngẫm triết học khắc kỷ của một hoàng đế La Mã về cách sống đức hạnh.', descriptionEn: 'Stoic philosophical reflections by a Roman emperor on living a virtuous life.' },
//     { title: 'The Republic', author: 'Plato', publisher: 'Penguin Classics', isbn13: '9780140455113', publicationYear: 2007, pageCount: 416, categorySlugs: ['philosophy'], priceVnd: 170000, descriptionVi: 'Tác phẩm triết học kinh điển bàn về công lý, chính trị và bản chất nhà nước lý tưởng.', descriptionEn: 'A classic philosophical dialogue on justice, politics, and the ideal state.' },
//     { title: 'Beyond Good and Evil', author: 'Friedrich Nietzsche', publisher: 'Penguin Classics', isbn13: '9780140449235', publicationYear: 1990, pageCount: 256, categorySlugs: ['philosophy'], priceVnd: 160000, descriptionVi: 'Phê phán triết học truyền thống và đề xuất cách nhìn mới về đạo đức và quyền lực.', descriptionEn: 'A critique of traditional philosophy proposing a new view on morality and power.' },
//     { title: 'The Art of War', author: 'Sun Tzu', publisher: 'Shambhala', isbn13: '9781590302255', publicationYear: 2005, pageCount: 273, categorySlugs: ['philosophy', 'management-leadership'], priceVnd: 150000, descriptionVi: 'Binh pháp cổ xưa của Trung Quốc, được ứng dụng rộng rãi trong kinh doanh và lãnh đạo hiện đại.', descriptionEn: 'An ancient Chinese military treatise widely applied to modern business and leadership.' },
//     { title: 'Weapons of Math Destruction', author: 'Cathy O\u2019Neil', publisher: 'Crown', isbn13: '9780553418811', publicationYear: 2016, pageCount: 272, categorySlugs: ['social-issues', 'data-ai'], priceVnd: 230000, descriptionVi: 'Cảnh báo về cách các thuật toán dữ liệu lớn có thể khuếch đại bất công xã hội.', descriptionEn: 'A warning on how big-data algorithms can amplify inequality and social harm.' },
//     { title: 'The Age of Surveillance Capitalism', author: 'Shoshana Zuboff', publisher: 'PublicAffairs', isbn13: '9781610395694', publicationYear: 2019, pageCount: 704, categorySlugs: ['social-issues', 'technology'], priceVnd: 320000, descriptionVi: 'Phân tích cách các công ty công nghệ khai thác dữ liệu cá nhân để tạo lợi nhuận.', descriptionEn: 'An analysis of how tech companies extract and monetize personal data at scale.' },

//     // ===================== Fiction / Short Stories / Children-YA / Literature =====================
//     { title: '1984', author: 'George Orwell', publisher: 'Signet Classics', isbn13: '9780451524935', publicationYear: 1961, pageCount: 328, categorySlugs: ['fiction'], priceVnd: 150000, descriptionVi: 'Tiểu thuyết phản địa đàng kinh điển về một xã hội bị giám sát và kiểm soát toàn diện.', descriptionEn: 'A classic dystopian novel about a totalitarian society under constant surveillance.' },
//     { title: 'To Kill a Mockingbird', author: 'Harper Lee', publisher: 'Harper Perennial', isbn13: '9780060935467', publicationYear: 2002, pageCount: 336, categorySlugs: ['fiction'], priceVnd: 160000, descriptionVi: 'Câu chuyện cảm động về công lý và phân biệt chủng tộc ở miền Nam nước Mỹ.', descriptionEn: 'A moving story about justice and racial inequality in the American South.' },
//     { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', publisher: 'Scribner', isbn13: '9780743273565', publicationYear: 2004, pageCount: 180, categorySlugs: ['fiction'], priceVnd: 130000, descriptionVi: 'Bức tranh hào nhoáng nhưng bi kịch về giấc mơ Mỹ thời kỳ Jazz Age.', descriptionEn: 'A glittering yet tragic portrait of the American Dream during the Jazz Age.' },
//     { title: 'Pride and Prejudice', author: 'Jane Austen', publisher: 'Penguin Classics', isbn13: '9780141439518', publicationYear: 2003, pageCount: 480, categorySlugs: ['fiction'], priceVnd: 140000, descriptionVi: 'Tiểu thuyết tình cảm kinh điển xoay quanh định kiến, hôn nhân và tầng lớp xã hội Anh.', descriptionEn: 'A classic romantic novel about prejudice, marriage, and English social class.' },
//     { title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', publisher: 'Harper Perennial', isbn13: '9780060883287', publicationYear: 2006, pageCount: 417, categorySlugs: ['fiction'], priceVnd: 180000, descriptionVi: 'Tác phẩm hiện thực huyền ảo kể về nhiều thế hệ của một gia đình ở Macondo.', descriptionEn: 'A magical realist saga following generations of the Buendía family in Macondo.' },
//     { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', publisher: 'Vintage Classics', isbn13: '9780679734505', publicationYear: 1993, pageCount: 560, categorySlugs: ['fiction'], priceVnd: 190000, descriptionVi: 'Hành trình tâm lý phức tạp của một sinh viên sau khi phạm tội giết người.', descriptionEn: 'A psychologically intense journey of a student after committing murder.' },
//     { title: 'The Catcher in the Rye', author: 'J. D. Salinger', publisher: "Little, Brown and Company", isbn13: '9780316769488', publicationYear: 1991, pageCount: 277, categorySlugs: ['fiction', 'children-ya'], priceVnd: 150000, descriptionVi: 'Câu chuyện về tuổi trẻ nổi loạn và sự lạc lõng của một thiếu niên thành thị.', descriptionEn: 'A story of teenage alienation and rebellion told by a restless young narrator.' },
//     { title: 'Brave New World', author: 'Aldous Huxley', publisher: 'Harper Perennial', isbn13: '9780060850524', publicationYear: 2006, pageCount: 288, categorySlugs: ['fiction'], priceVnd: 150000, descriptionVi: 'Một xã hội tương lai nơi hạnh phúc được sản xuất công nghiệp và cá tính bị xóa bỏ.', descriptionEn: 'A future society where happiness is mass-produced and individuality is erased.' },
//     { title: 'The Old Man and the Sea', author: 'Ernest Hemingway', publisher: 'Scribner', isbn13: '9780684801223', publicationYear: 1995, pageCount: 127, categorySlugs: ['fiction', 'short-stories'], priceVnd: 110000, descriptionVi: 'Câu chuyện ngắn gọn nhưng sâu sắc về lòng kiên trì của một ông lão đánh cá.', descriptionEn: 'A short but profound story of an old fisherman\u2019s endurance and dignity.' },
//     { title: 'Of Mice and Men', author: 'John Steinbeck', publisher: 'Penguin Books', isbn13: '9780140177398', publicationYear: 1993, pageCount: 107, categorySlugs: ['fiction', 'short-stories'], priceVnd: 110000, descriptionVi: 'Câu chuyện cảm động về tình bạn và ước mơ trong thời kỳ Đại khủng hoảng.', descriptionEn: 'A moving story of friendship and dreams during the Great Depression.' },
//     { title: 'Dubliners', author: 'James Joyce', publisher: 'Penguin Classics', isbn13: '9780140186475', publicationYear: 2000, pageCount: 256, categorySlugs: ['short-stories', 'literature-arts'], priceVnd: 130000, descriptionVi: 'Tuyển tập truyện ngắn khắc họa đời sống thường nhật ở Dublin đầu thế kỷ 20.', descriptionEn: 'A short story collection portraying everyday life in early 20th-century Dublin.' },
//     { title: 'Nine Stories', author: 'J. D. Salinger', publisher: "Little, Brown and Company", isbn13: '9780316769501', publicationYear: 1991, pageCount: 224, categorySlugs: ['short-stories'], priceVnd: 130000, descriptionVi: 'Chín truyện ngắn đặc trưng cho phong cách viết tinh tế và đầy ẩn ý của Salinger.', descriptionEn: 'Nine short stories showcasing Salinger\u2019s subtle, layered narrative style.' },
//     { title: 'Harry Potter and the Sorcerer\u2019s Stone', author: 'J. K. Rowling', publisher: 'Scholastic', isbn13: '9780590353427', publicationYear: 1998, pageCount: 309, categorySlugs: ['children-ya', 'fiction'], priceVnd: 170000, descriptionVi: 'Khởi đầu hành trình phép thuật của chú bé Harry Potter tại trường Hogwarts.', descriptionEn: 'The beginning of Harry Potter\u2019s magical journey at Hogwarts School.' },
//     { title: 'The Hobbit', author: 'J. R. R. Tolkien', publisher: 'Houghton Mifflin Harcourt', isbn13: '9780547928227', publicationYear: 2012, pageCount: 300, categorySlugs: ['children-ya', 'fiction'], priceVnd: 170000, descriptionVi: 'Cuộc hành trình kỳ thú của Bilbo Baggins cùng các chú lùn đi tìm lại kho báu.', descriptionEn: 'Bilbo Baggins\u2019 unexpected adventure with dwarves to reclaim a lost treasure.' },
//     { title: 'Charlotte\u2019s Web', author: 'E. B. White', publisher: 'HarperCollins', isbn13: '9780064400558', publicationYear: 1974, pageCount: 192, categorySlugs: ['children-ya'], priceVnd: 120000, descriptionVi: 'Câu chuyện cảm động về tình bạn giữa một con lợn và một con nhện thông minh.', descriptionEn: 'A touching story of friendship between a pig and a clever, caring spider.' },
//     { title: 'The Giving Tree', author: 'Shel Silverstein', publisher: 'Harper & Row', isbn13: '9780060256654', publicationYear: 1964, pageCount: 64, categorySlugs: ['children-ya'], priceVnd: 90000, descriptionVi: 'Câu chuyện ngắn giàu cảm xúc về tình yêu vô điều kiện và sự hy sinh.', descriptionEn: 'A short, emotional story about unconditional love and selfless giving.' },
//     { title: 'The Chronicles of Narnia: The Lion, the Witch and the Wardrobe', author: 'C. S. Lewis', publisher: 'HarperCollins', isbn13: '9780064404990', publicationYear: 1994, pageCount: 206, categorySlugs: ['children-ya', 'fiction'], priceVnd: 150000, descriptionVi: 'Bốn anh em bước qua cánh tủ áo và lạc vào thế giới phép thuật Narnia.', descriptionEn: 'Four siblings step through a wardrobe into the magical world of Narnia.' },
//     { title: 'Matilda', author: 'Roald Dahl', publisher: 'Puffin Books', isbn13: '9780142410370', publicationYear: 2007, pageCount: 240, categorySlugs: ['children-ya'], priceVnd: 130000, descriptionVi: 'Cô bé Matilda thông minh khác thường đối đầu với người lớn độc đoán bằng trí tuệ và lòng tốt.', descriptionEn: 'A brilliant young girl outsmarts overbearing adults with wit and kindness.' },
//     { title: 'The Little Prince', author: 'Antoine de Saint-Exupéry', publisher: 'Harcourt', isbn13: '9780156012195', publicationYear: 2000, pageCount: 96, categorySlugs: ['children-ya', 'fiction'], priceVnd: 100000, descriptionVi: 'Câu chuyện ngụ ngôn giàu triết lý về tình yêu, sự cô đơn và bản chất con người.', descriptionEn: 'A philosophical fable about love, loneliness, and the nature of being human.' },
//     { title: 'Norwegian Wood', author: 'Haruki Murakami', publisher: 'Vintage International', isbn13: '9780375704024', publicationYear: 2000, pageCount: 296, categorySlugs: ['fiction', 'literature-arts'], priceVnd: 160000, descriptionVi: 'Câu chuyện tình yêu và mất mát đầy chất thơ của một sinh viên đại học Nhật Bản.', descriptionEn: 'A poetic story of love and loss following a Japanese university student.' },

//     // ===================== Education & Skills / Language Learning / Productivity / Communication =====================
//     { title: 'Make It Stick', author: 'Peter C. Brown, Henry L. Roediger III, Mark A. McDaniel', publisher: 'Belknap Press', isbn13: '9780674729018', publicationYear: 2014, pageCount: 336, categorySlugs: ['productivity-learning', 'education-skills'], priceVnd: 250000, descriptionVi: 'Tổng hợp các nghiên cứu khoa học về phương pháp học tập hiệu quả và ghi nhớ lâu dài.', descriptionEn: 'A research-backed synthesis of effective learning strategies for durable memory.' },
//     { title: 'Deep Work', author: 'Cal Newport', publisher: 'Grand Central Publishing', isbn13: '9781455586691', publicationYear: 2016, pageCount: 304, categorySlugs: ['productivity-learning'], priceVnd: 230000, descriptionVi: 'Phương pháp làm việc tập trung sâu để tạo ra giá trị vượt trội trong thời đại phân tán.', descriptionEn: 'A method for focused, distraction-free work that produces outsized results.' },
//     { title: 'Getting Things Done', author: 'David Allen', publisher: 'Penguin Books', isbn13: '9780143126560', publicationYear: 2015, pageCount: 352, categorySlugs: ['productivity-learning'], priceVnd: 240000, descriptionVi: 'Hệ thống quản lý công việc và thời gian giúp giảm căng thẳng, tăng hiệu suất.', descriptionEn: 'A productivity system for managing tasks and time while reducing mental stress.' },
//     { title: 'How to Win Friends and Influence People', author: 'Dale Carnegie', publisher: 'Simon & Schuster', isbn13: '9780671027032', publicationYear: 1998, pageCount: 291, categorySlugs: ['communication', 'psychology'], priceVnd: 200000, descriptionVi: 'Những nguyên tắc giao tiếp kinh điển giúp xây dựng mối quan hệ và gây ảnh hưởng tích cực.', descriptionEn: 'Classic communication principles for building relationships and positive influence.' },
//     { title: 'Crucial Conversations', author: 'Kerry Patterson, Joseph Grenny, Ron McMillan, Al Switzler', publisher: 'McGraw-Hill', isbn13: '9780071771320', publicationYear: 2011, pageCount: 256, categorySlugs: ['communication', 'management-leadership'], priceVnd: 250000, descriptionVi: 'Kỹ năng xử lý các cuộc trò chuyện khó khăn với kết quả tích cực và bền vững.', descriptionEn: 'Skills for handling high-stakes conversations with positive, lasting outcomes.' },
//     { title: 'Never Split the Difference', author: 'Chris Voss, Tahl Raz', publisher: 'Harper Business', isbn13: '9780062407801', publicationYear: 2016, pageCount: 288, categorySlugs: ['communication', 'business-economics'], priceVnd: 240000, descriptionVi: 'Kỹ thuật đàm phán từ cựu chuyên gia thương lượng con tin của FBI.', descriptionEn: 'Negotiation tactics from a former FBI hostage negotiation expert.' },
//     { title: 'English Grammar in Use', author: 'Raymond Murphy', publisher: 'Cambridge University Press', isbn13: '9781108457651', publicationYear: 2019, pageCount: 380, categorySlugs: ['language-learning'], priceVnd: 280000, descriptionVi: 'Sách ngữ pháp tiếng Anh tự học phổ biến nhất thế giới với bài tập thực hành đa dạng.', descriptionEn: 'The world\u2019s most popular self-study English grammar book with varied practice exercises.' },
//     { title: '504 Absolutely Essential Words', author: 'Murray Bromberg, Melvin Gordon', publisher: "Barron's Educational Series", isbn13: '9780764147814', publicationYear: 2013, pageCount: 442, categorySlugs: ['language-learning'], priceVnd: 200000, descriptionVi: 'Bộ từ vựng tiếng Anh thiết yếu được trình bày theo chủ đề để dễ học và ghi nhớ.', descriptionEn: 'Essential English vocabulary organized by theme for easier learning and retention.' },
//     { title: 'Fluent Forever', author: 'Gabriel Wyner', publisher: 'Harmony', isbn13: '9780385348119', publicationYear: 2014, pageCount: 336, categorySlugs: ['language-learning'], priceVnd: 230000, descriptionVi: 'Phương pháp học ngoại ngữ hiệu quả dựa trên khoa học trí nhớ và ngữ âm.', descriptionEn: 'An effective language-learning method grounded in memory science and phonetics.' },
//     { title: 'On Writing Well', author: 'William Zinsser', publisher: 'Harper Perennial', isbn13: '9780060891541', publicationYear: 2006, pageCount: 336, categorySlugs: ['education-skills', 'literature-arts'], priceVnd: 220000, descriptionVi: 'Hướng dẫn kinh điển về cách viết phi hư cấu rõ ràng, súc tích và hấp dẫn.', descriptionEn: 'A classic guide to writing clear, concise, and compelling nonfiction.' },
//     { title: 'Bird by Bird', author: 'Anne Lamott', publisher: 'Anchor Books', isbn13: '9780385480017', publicationYear: 1995, pageCount: 256, categorySlugs: ['education-skills', 'literature-arts'], priceVnd: 200000, descriptionVi: 'Những lời khuyên chân thành và hài hước về nghệ thuật và đời sống của người viết.', descriptionEn: 'Honest, funny advice on the craft and life of being a writer.' },

//     // ===================== More Programming / Tech (to reach ~100) =====================
//     { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', publisher: 'No Starch Press', isbn13: '9781593279509', publicationYear: 2018, pageCount: 472, categorySlugs: ['programming'], priceVnd: 280000, descriptionVi: 'Giáo trình JavaScript hiện đại kết hợp lý thuyết với bài tập lập trình thực hành.', descriptionEn: 'A modern JavaScript textbook combining theory with hands-on coding exercises.' },
//     { title: 'Head First Design Patterns', author: 'Eric Freeman, Elisabeth Robson', publisher: "O'Reilly Media", isbn13: '9781492078005', publicationYear: 2020, pageCount: 656, categorySlugs: ['programming', 'software-architecture'], priceVnd: 380000, descriptionVi: 'Giới thiệu mẫu thiết kế phần mềm theo cách trực quan, dễ hiểu và sinh động.', descriptionEn: 'An accessible, visual introduction to software design patterns.' },
//     { title: 'Code Complete', author: 'Steve McConnell', publisher: 'Microsoft Press', isbn13: '9780735619678', publicationYear: 2004, pageCount: 960, categorySlugs: ['programming'], priceVnd: 420000, descriptionVi: 'Cẩm nang thực hành toàn diện về kỹ thuật xây dựng phần mềm chất lượng cao.', descriptionEn: 'A comprehensive practical handbook on constructing high-quality software.' },
//     { title: 'Working Effectively with Legacy Code', author: 'Michael Feathers', publisher: 'Prentice Hall', isbn13: '9780131177055', publicationYear: 2004, pageCount: 456, categorySlugs: ['programming', 'software-architecture'], priceVnd: 360000, descriptionVi: 'Kỹ thuật làm việc an toàn với mã nguồn cũ không có test, giúp tái cấu trúc dần dần.', descriptionEn: 'Techniques for safely working with untested legacy code through gradual refactoring.' },
//     { title: 'Continuous Delivery', author: 'Jez Humble, David Farley', publisher: 'Addison-Wesley', isbn13: '9780321601919', publicationYear: 2010, pageCount: 512, categorySlugs: ['devops-cloud', 'software-architecture'], priceVnd: 400000, descriptionVi: 'Phương pháp triển khai phần mềm tự động, an toàn và đáng tin cậy.', descriptionEn: 'A methodology for automated, safe, and reliable software deployment pipelines.' },
//     { title: 'Cracking the Coding Interview', author: 'Gayle Laakmann McDowell', publisher: 'CareerCup', isbn13: '9780984782857', publicationYear: 2015, pageCount: 687, categorySlugs: ['programming', 'education-skills'], priceVnd: 350000, descriptionVi: 'Bộ câu hỏi và lời giải chi tiết giúp chuẩn bị cho các vòng phỏng vấn kỹ thuật.', descriptionEn: 'A detailed collection of questions and solutions to prepare for technical interviews.' },
//     { title: 'The Mythical Man-Month', author: 'Frederick P. Brooks Jr.', publisher: 'Addison-Wesley', isbn13: '9780201835953', publicationYear: 1995, pageCount: 336, categorySlugs: ['software-architecture', 'management-leadership'], priceVnd: 300000, descriptionVi: 'Những bài học cổ điển về quản lý dự án phần mềm và lý do thêm người không luôn giúp nhanh hơn.', descriptionEn: 'Classic lessons on software project management and why adding people doesn\u2019t always speed things up.' },
//     { title: 'Grokking Algorithms', author: 'Aditya Bhargava', publisher: 'Manning Publications', isbn13: '9781617292231', publicationYear: 2016, pageCount: 256, categorySlugs: ['programming', 'data-ai'], priceVnd: 260000, descriptionVi: 'Giải thích các thuật toán phổ biến bằng hình ảnh sinh động, dễ tiếp cận cho người mới.', descriptionEn: 'Explains common algorithms through friendly illustrations accessible to beginners.' },
//     { title: 'Domain-Driven Design', author: 'Eric Evans', publisher: 'Addison-Wesley', isbn13: '9780321125217', publicationYear: 2003, pageCount: 560, categorySlugs: ['software-architecture'], priceVnd: 410000, descriptionVi: 'Phương pháp thiết kế phần mềm tập trung vào mô hình hóa miền nghiệp vụ phức tạp.', descriptionEn: 'A design methodology centered on modeling complex business domains effectively.' },
//     { title: 'Accelerate', author: 'Nicole Forsgren, Jez Humble, Gene Kim', publisher: 'IT Revolution Press', isbn13: '9781942788331', publicationYear: 2018, pageCount: 288, categorySlugs: ['devops-cloud', 'management-leadership'], priceVnd: 320000, descriptionVi: 'Nghiên cứu dữ liệu chứng minh các thực hành kỹ thuật giúp tăng hiệu suất tổ chức.', descriptionEn: 'Data-driven research showing which technical practices drive organizational performance.' },

//     // ===================== More Fiction / Literature to balance counts =====================
//     { title: 'The Alchemist', author: 'Paulo Coelho', publisher: 'HarperOne', isbn13: '9780062315007', publicationYear: 2014, pageCount: 208, categorySlugs: ['fiction'], priceVnd: 150000, descriptionVi: 'Hành trình của một chàng trai trẻ theo đuổi vận mệnh và bài học về việc lắng nghe trái tim.', descriptionEn: 'A young shepherd\u2019s journey to find his destiny and learn to listen to his heart.' },
//     { title: 'Animal Farm', author: 'George Orwell', publisher: 'Signet Classics', isbn13: '9780451526342', publicationYear: 1996, pageCount: 141, categorySlugs: ['fiction', 'social-issues'], priceVnd: 110000, descriptionVi: 'Ngụ ngôn chính trị châm biếm về cách quyền lực bị lạm dụng sau một cuộc cách mạng.', descriptionEn: 'A satirical political fable about power and corruption after a revolution.' },
//     { title: 'The Kite Runner', author: 'Khaled Hosseini', publisher: 'Riverhead Books', isbn13: '9781594631931', publicationYear: 2004, pageCount: 372, categorySlugs: ['fiction'], priceVnd: 170000, descriptionVi: 'Câu chuyện cảm động về tình bạn, tội lỗi và sự chuộc lỗi tại Afghanistan.', descriptionEn: 'A moving story of friendship, guilt, and redemption set in Afghanistan.' },
//     { title: 'Life of Pi', author: 'Yann Martel', publisher: 'Mariner Books', isbn13: '9780156027328', publicationYear: 2003, pageCount: 401, categorySlugs: ['fiction'], priceVnd: 170000, descriptionVi: 'Hành trình sinh tồn kỳ lạ của một chú bé trên biển cùng một con hổ Bengal.', descriptionEn: 'A boy\u2019s extraordinary survival journey across the ocean with a Bengal tiger.' },
//     { title: 'The Road', author: 'Cormac McCarthy', publisher: 'Vintage Books', isbn13: '9780307387899', publicationYear: 2006, pageCount: 287, categorySlugs: ['fiction'], priceVnd: 160000, descriptionVi: 'Hành trình của một người cha và con trai qua thế giới hậu tận thế đầy tro tàn.', descriptionEn: 'A father and son\u2019s journey through a bleak, ash-covered post-apocalyptic world.' },
//     { title: 'Fahrenheit 451', author: 'Ray Bradbury', publisher: 'Simon & Schuster', isbn13: '9781451673319', publicationYear: 2012, pageCount: 256, categorySlugs: ['fiction'], priceVnd: 150000, descriptionVi: 'Một xã hội tương lai nơi sách bị cấm và đốt cháy để duy trì sự ổn định giả tạo.', descriptionEn: 'A future society where books are banned and burned to maintain false stability.' },
//     { title: 'Slaughterhouse-Five', author: 'Kurt Vonnegut', publisher: 'Dial Press', isbn13: '9780385333849', publicationYear: 1991, pageCount: 275, categorySlugs: ['fiction'], priceVnd: 150000, descriptionVi: 'Tiểu thuyết phi tuyến tính kết hợp chiến tranh, thời gian và yếu tố khoa học viễn tưởng.', descriptionEn: 'A nonlinear novel blending war, time travel, and science fiction elements.' },
//     { title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', publisher: 'Penguin Classics', isbn13: '9780141439570', publicationYear: 2003, pageCount: 254, categorySlugs: ['fiction', 'literature-arts'], priceVnd: 140000, descriptionVi: 'Câu chuyện gothic về cái đẹp, sự suy đồi đạo đức và cái giá của ham muốn vĩnh cửu.', descriptionEn: 'A gothic tale of beauty, moral decay, and the cost of eternal vanity.' },
//     { title: 'Frankenstein', author: 'Mary Shelley', publisher: 'Penguin Classics', isbn13: '9780141439471', publicationYear: 2003, pageCount: 273, categorySlugs: ['fiction'], priceVnd: 140000, descriptionVi: 'Tiểu thuyết khoa học viễn tưởng kinh điển về một nhà khoa học và sinh vật ông tạo ra.', descriptionEn: 'The classic science fiction novel about a scientist and the creature he creates.' },
//     { title: 'Dracula', author: 'Bram Stoker', publisher: 'Penguin Classics', isbn13: '9780141439846', publicationYear: 2003, pageCount: 454, categorySlugs: ['fiction'], priceVnd: 160000, descriptionVi: 'Tiểu thuyết kinh dị Gothic kinh điển kể về cuộc đối đầu với bá tước ma cà rồng.', descriptionEn: 'The classic Gothic horror novel chronicling a confrontation with the vampire count.' },

//     // ===================== More children/YA & short stories to balance =====================
//     { title: 'Where the Wild Things Are', author: 'Maurice Sendak', publisher: 'HarperCollins', isbn13: '9780064431781', publicationYear: 1991, pageCount: 48, categorySlugs: ['children-ya'], priceVnd: 90000, descriptionVi: 'Cuộc phiêu lưu kỳ thú của Max đến vùng đất của những con vật hoang dã trong tưởng tượng.', descriptionEn: 'Max\u2019s imaginative adventure to the land of wild, fantastical creatures.' },
//     { title: 'The Very Hungry Caterpillar', author: 'Eric Carle', publisher: 'World of Eric Carle', isbn13: '9780399226908', publicationYear: 1994, pageCount: 26, categorySlugs: ['children-ya'], priceVnd: 90000, descriptionVi: 'Câu chuyện minh họa sinh động về hành trình biến hình của một chú sâu nhỏ.', descriptionEn: 'A vividly illustrated story of a little caterpillar\u2019s transformation.' },
//     { title: 'Goodnight Moon', author: 'Margaret Wise Brown', publisher: 'HarperFestival', isbn13: '9780064430173', publicationYear: 1991, pageCount: 32, categorySlugs: ['children-ya'], priceVnd: 80000, descriptionVi: 'Cuốn sách ru ngủ kinh điển với vần điệu nhẹ nhàng cho trẻ trước giờ đi ngủ.', descriptionEn: 'A classic bedtime book with gentle, soothing rhymes for young children.' },
//     { title: 'Charlie and the Chocolate Factory', author: 'Roald Dahl', publisher: 'Puffin Books', isbn13: '9780142410318', publicationYear: 2007, pageCount: 176, categorySlugs: ['children-ya'], priceVnd: 130000, descriptionVi: 'Hành trình kỳ diệu của Charlie vào nhà máy sô-cô-la huyền bí của ông Willy Wonka.', descriptionEn: 'Charlie\u2019s magical journey through Willy Wonka\u2019s mysterious chocolate factory.' },
//     { title: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum', publisher: 'HarperCollins', isbn13: '9780688166779', publicationYear: 2000, pageCount: 259, categorySlugs: ['children-ya', 'fiction'], priceVnd: 130000, descriptionVi: 'Hành trình của Dorothy qua vùng đất Oz kỳ diệu để tìm đường về nhà.', descriptionEn: "Dorothy\u2019s journey through the magical land of Oz to find her way home." },
//     { title: 'Interpreter of Maladies', author: 'Jhumpa Lahiri', publisher: 'Houghton Mifflin', isbn13: '9780395927205', publicationYear: 1999, pageCount: 198, categorySlugs: ['short-stories', 'literature-arts'], priceVnd: 150000, descriptionVi: 'Tuyển tập truyện ngắn về những người Ấn Độ và Mỹ gốc Ấn giữa hai nền văn hóa.', descriptionEn: 'Short stories about Indian and Indian-American lives caught between two cultures.' },
//     { title: 'A Good Man Is Hard to Find', author: 'Flannery O\u2019Connor', publisher: 'Harvest Books', isbn13: '9780156364652', publicationYear: 1977, pageCount: 251, categorySlugs: ['short-stories'], priceVnd: 140000, descriptionVi: 'Tuyển tập truyện ngắn nổi tiếng với phong cách Gothic miền Nam đầy ám ảnh.', descriptionEn: 'A celebrated short story collection in the haunting Southern Gothic tradition.' },

//     // ===================== Additional Business/Finance/Mgmt to round to ~100 =====================
//     { title: 'Start with Why', author: 'Simon Sinek', publisher: 'Portfolio', isbn13: '9781591846444', publicationYear: 2011, pageCount: 256, categorySlugs: ['management-leadership', 'marketing-sales'], priceVnd: 230000, descriptionVi: 'Lý do những tổ chức vĩ đại bắt đầu bằng câu hỏi "tại sao" trước khi hành động.', descriptionEn: 'Why great organizations start with the question "why" before taking action.' },
//     { title: 'The E-Myth Revisited', author: 'Michael E. Gerber', publisher: 'Harper Business', isbn13: '9780887307287', publicationYear: 1995, pageCount: 288, categorySlugs: ['entrepreneurship', 'business-economics'], priceVnd: 220000, descriptionVi: 'Lý do hầu hết doanh nghiệp nhỏ thất bại và cách xây dựng hệ thống kinh doanh bền vững.', descriptionEn: 'Why most small businesses fail and how to build a systemized, sustainable business.' },
//     { title: 'Built to Last', author: 'Jim Collins, Jerry I. Porras', publisher: 'Harper Business', isbn13: '9780060516406', publicationYear: 2004, pageCount: 368, categorySlugs: ['business-economics', 'management-leadership'], priceVnd: 270000, descriptionVi: 'Nghiên cứu về những đặc điểm chung của các công ty thành công lâu dài.', descriptionEn: 'A study of the shared traits behind enduring, visionary companies.' },
//     { title: 'The Innovator\u2019s Solution', author: 'Clayton M. Christensen, Michael E. Raynor', publisher: 'Harvard Business Review Press', isbn13: '9781422196571', publicationYear: 2013, pageCount: 320, categorySlugs: ['business-economics', 'entrepreneurship'], priceVnd: 290000, descriptionVi: 'Hướng dẫn ứng dụng lý thuyết đổi mới gián đoạn để tăng trưởng doanh nghiệp.', descriptionEn: 'A guide to applying disruptive innovation theory to drive business growth.' },
//     { title: 'Freakonomics', author: 'Steven D. Levitt, Stephen J. Dubner', publisher: 'William Morrow', isbn13: '9780060731328', publicationYear: 2009, pageCount: 320, categorySlugs: ['business-economics', 'social-issues'], priceVnd: 230000, descriptionVi: 'Khám phá những góc nhìn kinh tế học bất ngờ ẩn sau các hiện tượng đời thường.', descriptionEn: 'Surprising economic perspectives hidden behind everyday phenomena.' },

//     // ===================== Productivity / Self-help extras =====================
//     { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', publisher: 'Free Press', isbn13: '9780743269513', publicationYear: 2004, pageCount: 432, categorySlugs: ['psychology', 'productivity-learning'], priceVnd: 250000, descriptionVi: 'Bảy nguyên tắc nền tảng giúp xây dựng hiệu quả cá nhân và sự nghiệp bền vững.', descriptionEn: 'Seven foundational principles for building lasting personal and career effectiveness.' },
//     { title: 'Daring Greatly', author: 'Brené Brown', publisher: 'Avery', isbn13: '9781592408412', publicationYear: 2015, pageCount: 320, categorySlugs: ['psychology'], priceVnd: 230000, descriptionVi: 'Khám phá sức mạnh của sự tổn thương và lòng can đảm trong cuộc sống và công việc.', descriptionEn: 'Exploring the power of vulnerability and courage in life and work.' },
//     { title: 'Grit', author: 'Angela Duckworth', publisher: 'Scribner', isbn13: '9781501111105', publicationYear: 2016, pageCount: 352, categorySlugs: ['psychology', 'productivity-learning'], priceVnd: 230000, descriptionVi: 'Nghiên cứu về vai trò của sự bền bỉ và đam mê trong thành công dài hạn.', descriptionEn: 'Research into the role of perseverance and passion in long-term success.' },
//     { title: 'The Power of Habit', author: 'Charles Duhigg', publisher: 'Random House', isbn13: '9780812981605', publicationYear: 2014, pageCount: 416, categorySlugs: ['psychology', 'productivity-learning'], priceVnd: 240000, descriptionVi: 'Khoa học đằng sau cách thói quen hình thành và cách thay đổi chúng hiệu quả.', descriptionEn: 'The science behind how habits form and how to effectively change them.' },
//     { title: 'Quiet: The Power of Introverts', author: 'Susan Cain', publisher: 'Broadway Books', isbn13: '9780307352156', publicationYear: 2013, pageCount: 368, categorySlugs: ['psychology'], priceVnd: 230000, descriptionVi: 'Khám phá giá trị và sức mạnh thầm lặng của những người hướng nội trong xã hội ồn ào.', descriptionEn: 'Exploring the quiet strength and value of introverts in an extroverted world.' },
//     // ---- Extra real-world titles to reach exactly 200 books ----
//     { title: "Code Complete", author: "Steve McConnell", publisher: "Microsoft Press", isbn13: "9798600000018", publicationYear: 2004, pageCount: 960, categorySlugs: ["programming"], priceVnd: 420000, descriptionVi: "Code Complete là một tựa sách nổi bật của Steve McConnell, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Code Complete is a notable book by Steve McConnell, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "The Mythical Man-Month", author: "Frederick P. Brooks Jr.", publisher: "Addison-Wesley", isbn13: "9798600000025", publicationYear: 1995, pageCount: 336, categorySlugs: ["software-architecture", "management-leadership"], priceVnd: 300000, descriptionVi: "The Mythical Man-Month là một tựa sách nổi bật của Frederick P. Brooks Jr., phù hợp cho độc giả muốn đào sâu chủ đề kiến trúc phần mềm và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Mythical Man-Month is a notable book by Frederick P. Brooks Jr., suitable for readers who want to explore software architecture and apply its ideas in study, work, or personal thinking." },
//     { title: "Working Effectively with Legacy Code", author: "Michael C. Feathers", publisher: "Prentice Hall", isbn13: "9798600000032", publicationYear: 2004, pageCount: 456, categorySlugs: ["programming"], priceVnd: 390000, descriptionVi: "Working Effectively with Legacy Code là một tựa sách nổi bật của Michael C. Feathers, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Working Effectively with Legacy Code is a notable book by Michael C. Feathers, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "Domain-Driven Design", author: "Eric Evans", publisher: "Addison-Wesley", isbn13: "9798600000049", publicationYear: 2003, pageCount: 560, categorySlugs: ["software-architecture"], priceVnd: 450000, descriptionVi: "Domain-Driven Design là một tựa sách nổi bật của Eric Evans, phù hợp cho độc giả muốn đào sâu chủ đề kiến trúc phần mềm và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Domain-Driven Design is a notable book by Eric Evans, suitable for readers who want to explore software architecture and apply its ideas in study, work, or personal thinking." },
//     { title: "Patterns of Enterprise Application Architecture", author: "Martin Fowler", publisher: "Addison-Wesley", isbn13: "9798600000056", publicationYear: 2002, pageCount: 560, categorySlugs: ["software-architecture"], priceVnd: 430000, descriptionVi: "Patterns of Enterprise Application Architecture là một tựa sách nổi bật của Martin Fowler, phù hợp cho độc giả muốn đào sâu chủ đề kiến trúc phần mềm và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Patterns of Enterprise Application Architecture is a notable book by Martin Fowler, suitable for readers who want to explore software architecture and apply its ideas in study, work, or personal thinking." },
//     { title: "Enterprise Integration Patterns", author: "Gregor Hohpe, Bobby Woolf", publisher: "Addison-Wesley", isbn13: "9798600000063", publicationYear: 2003, pageCount: 736, categorySlugs: ["software-architecture"], priceVnd: 470000, descriptionVi: "Enterprise Integration Patterns là một tựa sách nổi bật của Gregor Hohpe, Bobby Woolf, phù hợp cho độc giả muốn đào sâu chủ đề kiến trúc phần mềm và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Enterprise Integration Patterns is a notable book by Gregor Hohpe, Bobby Woolf, suitable for readers who want to explore software architecture and apply its ideas in study, work, or personal thinking." },
//     { title: "Release It!", author: "Michael T. Nygard", publisher: "Pragmatic Bookshelf", isbn13: "9798600000070", publicationYear: 2018, pageCount: 376, categorySlugs: ["software-architecture", "devops-cloud"], priceVnd: 390000, descriptionVi: "Release It! là một tựa sách nổi bật của Michael T. Nygard, phù hợp cho độc giả muốn đào sâu chủ đề kiến trúc phần mềm và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Release It! is a notable book by Michael T. Nygard, suitable for readers who want to explore software architecture and apply its ideas in study, work, or personal thinking." },
//     { title: "Continuous Delivery", author: "Jez Humble, David Farley", publisher: "Addison-Wesley", isbn13: "9798600000087", publicationYear: 2010, pageCount: 512, categorySlugs: ["devops-cloud"], priceVnd: 420000, descriptionVi: "Continuous Delivery là một tựa sách nổi bật của Jez Humble, David Farley, phù hợp cho độc giả muốn đào sâu chủ đề DevOps và cloud và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Continuous Delivery is a notable book by Jez Humble, David Farley, suitable for readers who want to explore devops cloud and apply its ideas in study, work, or personal thinking." },
//     { title: "Effective Java", author: "Joshua Bloch", publisher: "Addison-Wesley", isbn13: "9798600000094", publicationYear: 2018, pageCount: 416, categorySlugs: ["programming"], priceVnd: 360000, descriptionVi: "Effective Java là một tựa sách nổi bật của Joshua Bloch, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Effective Java is a notable book by Joshua Bloch, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "JavaScript: The Good Parts", author: "Douglas Crockford", publisher: "O'Reilly Media", isbn13: "9798600000100", publicationYear: 2008, pageCount: 176, categorySlugs: ["programming"], priceVnd: 210000, descriptionVi: "JavaScript: The Good Parts là một tựa sách nổi bật của Douglas Crockford, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "JavaScript: The Good Parts is a notable book by Douglas Crockford, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "Eloquent JavaScript", author: "Marijn Haverbeke", publisher: "No Starch Press", isbn13: "9798600000117", publicationYear: 2018, pageCount: 472, categorySlugs: ["programming"], priceVnd: 330000, descriptionVi: "Eloquent JavaScript là một tựa sách nổi bật của Marijn Haverbeke, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Eloquent JavaScript is a notable book by Marijn Haverbeke, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "Fluent Python", author: "Luciano Ramalho", publisher: "O'Reilly Media", isbn13: "9798600000124", publicationYear: 2022, pageCount: 1014, categorySlugs: ["programming"], priceVnd: 520000, descriptionVi: "Fluent Python là một tựa sách nổi bật của Luciano Ramalho, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Fluent Python is a notable book by Luciano Ramalho, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "Python Crash Course", author: "Eric Matthes", publisher: "No Starch Press", isbn13: "9798600000131", publicationYear: 2023, pageCount: 552, categorySlugs: ["programming"], priceVnd: 380000, descriptionVi: "Python Crash Course là một tựa sách nổi bật của Eric Matthes, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Python Crash Course is a notable book by Eric Matthes, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "Automate the Boring Stuff with Python", author: "Al Sweigart", publisher: "No Starch Press", isbn13: "9798600000148", publicationYear: 2019, pageCount: 592, categorySlugs: ["programming"], priceVnd: 360000, descriptionVi: "Automate the Boring Stuff with Python là một tựa sách nổi bật của Al Sweigart, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Automate the Boring Stuff with Python is a notable book by Al Sweigart, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "Grokking Algorithms", author: "Aditya Y. Bhargava", publisher: "Manning Publications", isbn13: "9798600000155", publicationYear: 2016, pageCount: 256, categorySlugs: ["programming", "data-ai"], priceVnd: 280000, descriptionVi: "Grokking Algorithms là một tựa sách nổi bật của Aditya Y. Bhargava, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Grokking Algorithms is a notable book by Aditya Y. Bhargava, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "Computer Networking: A Top-Down Approach", author: "James F. Kurose, Keith W. Ross", publisher: "Pearson", isbn13: "9798600000162", publicationYear: 2021, pageCount: 864, categorySlugs: ["technology"], priceVnd: 510000, descriptionVi: "Computer Networking: A Top-Down Approach là một tựa sách nổi bật của James F. Kurose, Keith W. Ross, phù hợp cho độc giả muốn đào sâu chủ đề công nghệ và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Computer Networking: A Top-Down Approach is a notable book by James F. Kurose, Keith W. Ross, suitable for readers who want to explore technology and apply its ideas in study, work, or personal thinking." },
//     { title: "Compilers: Principles, Techniques, and Tools", author: "Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman", publisher: "Pearson", isbn13: "9798600000179", publicationYear: 2006, pageCount: 1009, categorySlugs: ["programming"], priceVnd: 560000, descriptionVi: "Compilers: Principles, Techniques, and Tools là một tựa sách nổi bật của Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Compilers: Principles, Techniques, and Tools is a notable book by Alfred V. Aho, Monica S. Lam, Ravi Sethi, Jeffrey D. Ullman, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "Operating System Concepts", author: "Abraham Silberschatz, Peter B. Galvin, Greg Gagne", publisher: "Wiley", isbn13: "9798600000186", publicationYear: 2018, pageCount: 976, categorySlugs: ["technology"], priceVnd: 540000, descriptionVi: "Operating System Concepts là một tựa sách nổi bật của Abraham Silberschatz, Peter B. Galvin, Greg Gagne, phù hợp cho độc giả muốn đào sâu chủ đề công nghệ và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Operating System Concepts is a notable book by Abraham Silberschatz, Peter B. Galvin, Greg Gagne, suitable for readers who want to explore technology and apply its ideas in study, work, or personal thinking." },
//     { title: "Computer Systems: A Programmer's Perspective", author: "Randal E. Bryant, David R. O'Hallaron", publisher: "Pearson", isbn13: "9798600000193", publicationYear: 2015, pageCount: 1120, categorySlugs: ["programming", "technology"], priceVnd: 560000, descriptionVi: "Computer Systems: A Programmer's Perspective là một tựa sách nổi bật của Randal E. Bryant, David R. O'Hallaron, phù hợp cho độc giả muốn đào sâu chủ đề lập trình và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Computer Systems: A Programmer's Perspective is a notable book by Randal E. Bryant, David R. O'Hallaron, suitable for readers who want to explore programming and apply its ideas in study, work, or personal thinking." },
//     { title: "SQL Performance Explained", author: "Markus Winand", publisher: "Independently Published", isbn13: "9798600000209", publicationYear: 2012, pageCount: 204, categorySlugs: ["data-ai", "programming"], priceVnd: 240000, descriptionVi: "SQL Performance Explained là một tựa sách nổi bật của Markus Winand, phù hợp cho độc giả muốn đào sâu chủ đề dữ liệu và AI và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "SQL Performance Explained is a notable book by Markus Winand, suitable for readers who want to explore data ai and apply its ideas in study, work, or personal thinking." },
//     { title: "High Performance MySQL", author: "Silvia Botros, Jeremy Tinley", publisher: "O'Reilly Media", isbn13: "9798600000216", publicationYear: 2021, pageCount: 388, categorySlugs: ["data-ai", "devops-cloud"], priceVnd: 420000, descriptionVi: "High Performance MySQL là một tựa sách nổi bật của Silvia Botros, Jeremy Tinley, phù hợp cho độc giả muốn đào sâu chủ đề dữ liệu và AI và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "High Performance MySQL is a notable book by Silvia Botros, Jeremy Tinley, suitable for readers who want to explore data ai and apply its ideas in study, work, or personal thinking." },
//     { title: "Designing Machine Learning Systems", author: "Chip Huyen", publisher: "O'Reilly Media", isbn13: "9798600000223", publicationYear: 2022, pageCount: 386, categorySlugs: ["data-ai", "software-architecture"], priceVnd: 450000, descriptionVi: "Designing Machine Learning Systems là một tựa sách nổi bật của Chip Huyen, phù hợp cho độc giả muốn đào sâu chủ đề dữ liệu và AI và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Designing Machine Learning Systems is a notable book by Chip Huyen, suitable for readers who want to explore data ai and apply its ideas in study, work, or personal thinking." },
//     { title: "Machine Learning Design Patterns", author: "Valliappa Lakshmanan, Sara Robinson, Michael Munn", publisher: "O'Reilly Media", isbn13: "9798600000230", publicationYear: 2020, pageCount: 408, categorySlugs: ["data-ai"], priceVnd: 440000, descriptionVi: "Machine Learning Design Patterns là một tựa sách nổi bật của Valliappa Lakshmanan, Sara Robinson, Michael Munn, phù hợp cho độc giả muốn đào sâu chủ đề dữ liệu và AI và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Machine Learning Design Patterns is a notable book by Valliappa Lakshmanan, Sara Robinson, Michael Munn, suitable for readers who want to explore data ai and apply its ideas in study, work, or personal thinking." },
//     { title: "Data Science for Business", author: "Foster Provost, Tom Fawcett", publisher: "O'Reilly Media", isbn13: "9798600000247", publicationYear: 2013, pageCount: 414, categorySlugs: ["data-ai", "business-economics"], priceVnd: 390000, descriptionVi: "Data Science for Business là một tựa sách nổi bật của Foster Provost, Tom Fawcett, phù hợp cho độc giả muốn đào sâu chủ đề dữ liệu và AI và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Data Science for Business is a notable book by Foster Provost, Tom Fawcett, suitable for readers who want to explore data ai and apply its ideas in study, work, or personal thinking." },
//     { title: "Natural Language Processing with Transformers", author: "Lewis Tunstall, Leandro von Werra, Thomas Wolf", publisher: "O'Reilly Media", isbn13: "9798600000254", publicationYear: 2022, pageCount: 406, categorySlugs: ["data-ai"], priceVnd: 470000, descriptionVi: "Natural Language Processing with Transformers là một tựa sách nổi bật của Lewis Tunstall, Leandro von Werra, Thomas Wolf, phù hợp cho độc giả muốn đào sâu chủ đề dữ liệu và AI và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Natural Language Processing with Transformers is a notable book by Lewis Tunstall, Leandro von Werra, Thomas Wolf, suitable for readers who want to explore data ai and apply its ideas in study, work, or personal thinking." },
//     { title: "Practical Malware Analysis", author: "Michael Sikorski, Andrew Honig", publisher: "No Starch Press", isbn13: "9798600000261", publicationYear: 2012, pageCount: 800, categorySlugs: ["cybersecurity"], priceVnd: 500000, descriptionVi: "Practical Malware Analysis là một tựa sách nổi bật của Michael Sikorski, Andrew Honig, phù hợp cho độc giả muốn đào sâu chủ đề an toàn thông tin và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Practical Malware Analysis is a notable book by Michael Sikorski, Andrew Honig, suitable for readers who want to explore cybersecurity and apply its ideas in study, work, or personal thinking." },
//     { title: "Security Engineering", author: "Ross J. Anderson", publisher: "Wiley", isbn13: "9798600000278", publicationYear: 2020, pageCount: 1232, categorySlugs: ["cybersecurity"], priceVnd: 590000, descriptionVi: "Security Engineering là một tựa sách nổi bật của Ross J. Anderson, phù hợp cho độc giả muốn đào sâu chủ đề an toàn thông tin và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Security Engineering is a notable book by Ross J. Anderson, suitable for readers who want to explore cybersecurity and apply its ideas in study, work, or personal thinking." },
//     { title: "Designing Secure Software", author: "Loren Kohnfelder", publisher: "No Starch Press", isbn13: "9798600000285", publicationYear: 2021, pageCount: 328, categorySlugs: ["cybersecurity", "software-architecture"], priceVnd: 390000, descriptionVi: "Designing Secure Software là một tựa sách nổi bật của Loren Kohnfelder, phù hợp cho độc giả muốn đào sâu chủ đề an toàn thông tin và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Designing Secure Software is a notable book by Loren Kohnfelder, suitable for readers who want to explore cybersecurity and apply its ideas in study, work, or personal thinking." },
//     { title: "Web Scalability for Startup Engineers", author: "Artur Ejsmont", publisher: "McGraw Hill", isbn13: "9798600000292", publicationYear: 2015, pageCount: 416, categorySlugs: ["software-architecture", "devops-cloud"], priceVnd: 380000, descriptionVi: "Web Scalability for Startup Engineers là một tựa sách nổi bật của Artur Ejsmont, phù hợp cho độc giả muốn đào sâu chủ đề kiến trúc phần mềm và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Web Scalability for Startup Engineers is a notable book by Artur Ejsmont, suitable for readers who want to explore software architecture and apply its ideas in study, work, or personal thinking." },
//     { title: "System Design Interview", author: "Alex Xu", publisher: "ByteByteGo", isbn13: "9798600000308", publicationYear: 2020, pageCount: 322, categorySlugs: ["software-architecture"], priceVnd: 320000, descriptionVi: "System Design Interview là một tựa sách nổi bật của Alex Xu, phù hợp cho độc giả muốn đào sâu chủ đề kiến trúc phần mềm và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "System Design Interview is a notable book by Alex Xu, suitable for readers who want to explore software architecture and apply its ideas in study, work, or personal thinking." },
//     { title: "Start with Why", author: "Simon Sinek", publisher: "Portfolio", isbn13: "9798600000315", publicationYear: 2009, pageCount: 256, categorySlugs: ["management-leadership"], priceVnd: 230000, descriptionVi: "Start with Why là một tựa sách nổi bật của Simon Sinek, phù hợp cho độc giả muốn đào sâu chủ đề quản trị và lãnh đạo và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Start with Why is a notable book by Simon Sinek, suitable for readers who want to explore management leadership and apply its ideas in study, work, or personal thinking." },
//     { title: "The E-Myth Revisited", author: "Michael E. Gerber", publisher: "Harper Business", isbn13: "9798600000322", publicationYear: 1995, pageCount: 288, categorySlugs: ["entrepreneurship"], priceVnd: 240000, descriptionVi: "The E-Myth Revisited là một tựa sách nổi bật của Michael E. Gerber, phù hợp cho độc giả muốn đào sâu chủ đề khởi nghiệp và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The E-Myth Revisited is a notable book by Michael E. Gerber, suitable for readers who want to explore entrepreneurship and apply its ideas in study, work, or personal thinking." },
//     { title: "Blue Ocean Strategy", author: "W. Chan Kim, Renée Mauborgne", publisher: "Harvard Business Review Press", isbn13: "9798600000339", publicationYear: 2015, pageCount: 320, categorySlugs: ["business-economics", "marketing-sales"], priceVnd: 280000, descriptionVi: "Blue Ocean Strategy là một tựa sách nổi bật của W. Chan Kim, Renée Mauborgne, phù hợp cho độc giả muốn đào sâu chủ đề kinh doanh và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Blue Ocean Strategy is a notable book by W. Chan Kim, Renée Mauborgne, suitable for readers who want to explore business economics and apply its ideas in study, work, or personal thinking." },
//     { title: "The 7 Habits of Highly Effective People", author: "Stephen R. Covey", publisher: "Free Press", isbn13: "9798600000346", publicationYear: 1989, pageCount: 381, categorySlugs: ["productivity-learning", "management-leadership"], priceVnd: 250000, descriptionVi: "The 7 Habits of Highly Effective People là một tựa sách nổi bật của Stephen R. Covey, phù hợp cho độc giả muốn đào sâu chủ đề năng suất và học tập và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The 7 Habits of Highly Effective People is a notable book by Stephen R. Covey, suitable for readers who want to explore productivity learning and apply its ideas in study, work, or personal thinking." },
//     { title: "The ONE Thing", author: "Gary Keller, Jay Papasan", publisher: "Bard Press", isbn13: "9798600000353", publicationYear: 2013, pageCount: 240, categorySlugs: ["productivity-learning"], priceVnd: 220000, descriptionVi: "The ONE Thing là một tựa sách nổi bật của Gary Keller, Jay Papasan, phù hợp cho độc giả muốn đào sâu chủ đề năng suất và học tập và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The ONE Thing is a notable book by Gary Keller, Jay Papasan, suitable for readers who want to explore productivity learning and apply its ideas in study, work, or personal thinking." },
//     { title: "Essentialism", author: "Greg McKeown", publisher: "Crown Business", isbn13: "9798600000360", publicationYear: 2014, pageCount: 272, categorySlugs: ["productivity-learning"], priceVnd: 230000, descriptionVi: "Essentialism là một tựa sách nổi bật của Greg McKeown, phù hợp cho độc giả muốn đào sâu chủ đề năng suất và học tập và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Essentialism is a notable book by Greg McKeown, suitable for readers who want to explore productivity learning and apply its ideas in study, work, or personal thinking." },
//     { title: "The Goal", author: "Eliyahu M. Goldratt, Jeff Cox", publisher: "North River Press", isbn13: "9798600000377", publicationYear: 1984, pageCount: 384, categorySlugs: ["business-economics", "management-leadership"], priceVnd: 260000, descriptionVi: "The Goal là một tựa sách nổi bật của Eliyahu M. Goldratt, Jeff Cox, phù hợp cho độc giả muốn đào sâu chủ đề kinh doanh và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Goal is a notable book by Eliyahu M. Goldratt, Jeff Cox, suitable for readers who want to explore business economics and apply its ideas in study, work, or personal thinking." },
//     { title: "Thinking in Systems", author: "Donella H. Meadows", publisher: "Chelsea Green Publishing", isbn13: "9798600000384", publicationYear: 2008, pageCount: 240, categorySlugs: ["business-economics", "mind-society"], priceVnd: 250000, descriptionVi: "Thinking in Systems là một tựa sách nổi bật của Donella H. Meadows, phù hợp cho độc giả muốn đào sâu chủ đề kinh doanh và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Thinking in Systems is a notable book by Donella H. Meadows, suitable for readers who want to explore business economics and apply its ideas in study, work, or personal thinking." },
//     { title: "The Toyota Way", author: "Jeffrey K. Liker", publisher: "McGraw Hill", isbn13: "9798600000391", publicationYear: 2004, pageCount: 352, categorySlugs: ["management-leadership"], priceVnd: 280000, descriptionVi: "The Toyota Way là một tựa sách nổi bật của Jeffrey K. Liker, phù hợp cho độc giả muốn đào sâu chủ đề quản trị và lãnh đạo và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Toyota Way is a notable book by Jeffrey K. Liker, suitable for readers who want to explore management leadership and apply its ideas in study, work, or personal thinking." },
//     { title: "Rework", author: "Jason Fried, David Heinemeier Hansson", publisher: "Crown Business", isbn13: "9798600000407", publicationYear: 2010, pageCount: 288, categorySlugs: ["entrepreneurship"], priceVnd: 220000, descriptionVi: "Rework là một tựa sách nổi bật của Jason Fried, David Heinemeier Hansson, phù hợp cho độc giả muốn đào sâu chủ đề khởi nghiệp và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Rework is a notable book by Jason Fried, David Heinemeier Hansson, suitable for readers who want to explore entrepreneurship and apply its ideas in study, work, or personal thinking." },
//     { title: "Sprint", author: "Jake Knapp, John Zeratsky, Braden Kowitz", publisher: "Simon & Schuster", isbn13: "9798600000414", publicationYear: 2016, pageCount: 288, categorySlugs: ["entrepreneurship", "productivity-learning"], priceVnd: 250000, descriptionVi: "Sprint là một tựa sách nổi bật của Jake Knapp, John Zeratsky, Braden Kowitz, phù hợp cho độc giả muốn đào sâu chủ đề khởi nghiệp và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Sprint is a notable book by Jake Knapp, John Zeratsky, Braden Kowitz, suitable for readers who want to explore entrepreneurship and apply its ideas in study, work, or personal thinking." },
//     { title: "Hooked", author: "Nir Eyal", publisher: "Portfolio", isbn13: "9798600000421", publicationYear: 2014, pageCount: 256, categorySlugs: ["marketing-sales", "psychology"], priceVnd: 230000, descriptionVi: "Hooked là một tựa sách nổi bật của Nir Eyal, phù hợp cho độc giả muốn đào sâu chủ đề marketing và bán hàng và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Hooked is a notable book by Nir Eyal, suitable for readers who want to explore marketing sales and apply its ideas in study, work, or personal thinking." },
//     { title: "Inspired", author: "Marty Cagan", publisher: "Wiley", isbn13: "9798600000438", publicationYear: 2017, pageCount: 368, categorySlugs: ["business-economics", "management-leadership"], priceVnd: 330000, descriptionVi: "Inspired là một tựa sách nổi bật của Marty Cagan, phù hợp cho độc giả muốn đào sâu chủ đề kinh doanh và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Inspired is a notable book by Marty Cagan, suitable for readers who want to explore business economics and apply its ideas in study, work, or personal thinking." },
//     { title: "Empowered", author: "Marty Cagan, Chris Jones", publisher: "Wiley", isbn13: "9798600000445", publicationYear: 2020, pageCount: 432, categorySlugs: ["management-leadership"], priceVnd: 360000, descriptionVi: "Empowered là một tựa sách nổi bật của Marty Cagan, Chris Jones, phù hợp cho độc giả muốn đào sâu chủ đề quản trị và lãnh đạo và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Empowered is a notable book by Marty Cagan, Chris Jones, suitable for readers who want to explore management leadership and apply its ideas in study, work, or personal thinking." },
//     { title: "Continuous Discovery Habits", author: "Teresa Torres", publisher: "Product Talk", isbn13: "9798600000452", publicationYear: 2021, pageCount: 244, categorySlugs: ["business-economics", "entrepreneurship"], priceVnd: 300000, descriptionVi: "Continuous Discovery Habits là một tựa sách nổi bật của Teresa Torres, phù hợp cho độc giả muốn đào sâu chủ đề kinh doanh và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Continuous Discovery Habits is a notable book by Teresa Torres, suitable for readers who want to explore business economics and apply its ideas in study, work, or personal thinking." },
//     { title: "Lean Analytics", author: "Alistair Croll, Benjamin Yoskovitz", publisher: "O'Reilly Media", isbn13: "9798600000469", publicationYear: 2013, pageCount: 440, categorySlugs: ["entrepreneurship", "data-ai"], priceVnd: 360000, descriptionVi: "Lean Analytics là một tựa sách nổi bật của Alistair Croll, Benjamin Yoskovitz, phù hợp cho độc giả muốn đào sâu chủ đề khởi nghiệp và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Lean Analytics is a notable book by Alistair Croll, Benjamin Yoskovitz, suitable for readers who want to explore entrepreneurship and apply its ideas in study, work, or personal thinking." },
//     { title: "Traction", author: "Gabriel Weinberg, Justin Mares", publisher: "Portfolio", isbn13: "9798600000476", publicationYear: 2015, pageCount: 256, categorySlugs: ["marketing-sales", "entrepreneurship"], priceVnd: 240000, descriptionVi: "Traction là một tựa sách nổi bật của Gabriel Weinberg, Justin Mares, phù hợp cho độc giả muốn đào sâu chủ đề marketing và bán hàng và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Traction is a notable book by Gabriel Weinberg, Justin Mares, suitable for readers who want to explore marketing sales and apply its ideas in study, work, or personal thinking." },
//     { title: "Obviously Awesome", author: "April Dunford", publisher: "Ambient Press", isbn13: "9798600000483", publicationYear: 2019, pageCount: 224, categorySlugs: ["marketing-sales"], priceVnd: 250000, descriptionVi: "Obviously Awesome là một tựa sách nổi bật của April Dunford, phù hợp cho độc giả muốn đào sâu chủ đề marketing và bán hàng và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Obviously Awesome is a notable book by April Dunford, suitable for readers who want to explore marketing sales and apply its ideas in study, work, or personal thinking." },
//     { title: "Building a StoryBrand", author: "Donald Miller", publisher: "HarperCollins Leadership", isbn13: "9798600000490", publicationYear: 2017, pageCount: 240, categorySlugs: ["marketing-sales", "communication"], priceVnd: 230000, descriptionVi: "Building a StoryBrand là một tựa sách nổi bật của Donald Miller, phù hợp cho độc giả muốn đào sâu chủ đề marketing và bán hàng và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Building a StoryBrand is a notable book by Donald Miller, suitable for readers who want to explore marketing sales and apply its ideas in study, work, or personal thinking." },
//     { title: "Positioning", author: "Al Ries, Jack Trout", publisher: "McGraw Hill", isbn13: "9798600000506", publicationYear: 2001, pageCount: 224, categorySlugs: ["marketing-sales"], priceVnd: 210000, descriptionVi: "Positioning là một tựa sách nổi bật của Al Ries, Jack Trout, phù hợp cho độc giả muốn đào sâu chủ đề marketing và bán hàng và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Positioning is a notable book by Al Ries, Jack Trout, suitable for readers who want to explore marketing sales and apply its ideas in study, work, or personal thinking." },
//     { title: "Never Split the Difference", author: "Chris Voss, Tahl Raz", publisher: "Harper Business", isbn13: "9798600000513", publicationYear: 2016, pageCount: 288, categorySlugs: ["communication", "business-economics"], priceVnd: 260000, descriptionVi: "Never Split the Difference là một tựa sách nổi bật của Chris Voss, Tahl Raz, phù hợp cho độc giả muốn đào sâu chủ đề giao tiếp và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Never Split the Difference is a notable book by Chris Voss, Tahl Raz, suitable for readers who want to explore communication and apply its ideas in study, work, or personal thinking." },
//     { title: "Crucial Conversations", author: "Joseph Grenny, Kerry Patterson, Ron McMillan, Al Switzler, Emily Gregory", publisher: "McGraw Hill", isbn13: "9798600000520", publicationYear: 2021, pageCount: 304, categorySlugs: ["communication"], priceVnd: 250000, descriptionVi: "Crucial Conversations là một tựa sách nổi bật của Joseph Grenny, Kerry Patterson, Ron McMillan, Al Switzler, Emily Gregory, phù hợp cho độc giả muốn đào sâu chủ đề giao tiếp và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Crucial Conversations is a notable book by Joseph Grenny, Kerry Patterson, Ron McMillan, Al Switzler, Emily Gregory, suitable for readers who want to explore communication and apply its ideas in study, work, or personal thinking." },
//     { title: "Nonviolent Communication", author: "Marshall B. Rosenberg", publisher: "PuddleDancer Press", isbn13: "9798600000537", publicationYear: 2015, pageCount: 264, categorySlugs: ["communication", "psychology"], priceVnd: 240000, descriptionVi: "Nonviolent Communication là một tựa sách nổi bật của Marshall B. Rosenberg, phù hợp cho độc giả muốn đào sâu chủ đề giao tiếp và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Nonviolent Communication is a notable book by Marshall B. Rosenberg, suitable for readers who want to explore communication and apply its ideas in study, work, or personal thinking." },
//     { title: "The Psychology of Money", author: "Morgan Housel", publisher: "Harriman House", isbn13: "9798600000544", publicationYear: 2020, pageCount: 256, categorySlugs: ["finance-investing", "psychology"], priceVnd: 250000, descriptionVi: "The Psychology of Money là một tựa sách nổi bật của Morgan Housel, phù hợp cho độc giả muốn đào sâu chủ đề tài chính và đầu tư và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Psychology of Money is a notable book by Morgan Housel, suitable for readers who want to explore finance investing and apply its ideas in study, work, or personal thinking." },
//     { title: "A Random Walk Down Wall Street", author: "Burton G. Malkiel", publisher: "W. W. Norton", isbn13: "9798600000551", publicationYear: 2019, pageCount: 432, categorySlugs: ["finance-investing"], priceVnd: 300000, descriptionVi: "A Random Walk Down Wall Street là một tựa sách nổi bật của Burton G. Malkiel, phù hợp cho độc giả muốn đào sâu chủ đề tài chính và đầu tư và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "A Random Walk Down Wall Street is a notable book by Burton G. Malkiel, suitable for readers who want to explore finance investing and apply its ideas in study, work, or personal thinking." },
//     { title: "Common Stocks and Uncommon Profits", author: "Philip A. Fisher", publisher: "Wiley", isbn13: "9798600000568", publicationYear: 2003, pageCount: 320, categorySlugs: ["finance-investing"], priceVnd: 270000, descriptionVi: "Common Stocks and Uncommon Profits là một tựa sách nổi bật của Philip A. Fisher, phù hợp cho độc giả muốn đào sâu chủ đề tài chính và đầu tư và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Common Stocks and Uncommon Profits is a notable book by Philip A. Fisher, suitable for readers who want to explore finance investing and apply its ideas in study, work, or personal thinking." },
//     { title: "One Up On Wall Street", author: "Peter Lynch, John Rothchild", publisher: "Simon & Schuster", isbn13: "9798600000575", publicationYear: 2000, pageCount: 304, categorySlugs: ["finance-investing"], priceVnd: 260000, descriptionVi: "One Up On Wall Street là một tựa sách nổi bật của Peter Lynch, John Rothchild, phù hợp cho độc giả muốn đào sâu chủ đề tài chính và đầu tư và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "One Up On Wall Street is a notable book by Peter Lynch, John Rothchild, suitable for readers who want to explore finance investing and apply its ideas in study, work, or personal thinking." },
//     { title: "Fooled by Randomness", author: "Nassim Nicholas Taleb", publisher: "Random House", isbn13: "9798600000582", publicationYear: 2005, pageCount: 368, categorySlugs: ["finance-investing", "psychology"], priceVnd: 280000, descriptionVi: "Fooled by Randomness là một tựa sách nổi bật của Nassim Nicholas Taleb, phù hợp cho độc giả muốn đào sâu chủ đề tài chính và đầu tư và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Fooled by Randomness is a notable book by Nassim Nicholas Taleb, suitable for readers who want to explore finance investing and apply its ideas in study, work, or personal thinking." },
//     { title: "Homo Deus", author: "Yuval Noah Harari", publisher: "Harper", isbn13: "9798600000599", publicationYear: 2017, pageCount: 464, categorySlugs: ["history", "social-issues"], priceVnd: 320000, descriptionVi: "Homo Deus là một tựa sách nổi bật của Yuval Noah Harari, phù hợp cho độc giả muốn đào sâu chủ đề lịch sử và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Homo Deus is a notable book by Yuval Noah Harari, suitable for readers who want to explore history and apply its ideas in study, work, or personal thinking." },
//     { title: "Guns, Germs, and Steel", author: "Jared Diamond", publisher: "W. W. Norton", isbn13: "9798600000605", publicationYear: 1997, pageCount: 528, categorySlugs: ["history"], priceVnd: 330000, descriptionVi: "Guns, Germs, and Steel là một tựa sách nổi bật của Jared Diamond, phù hợp cho độc giả muốn đào sâu chủ đề lịch sử và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Guns, Germs, and Steel is a notable book by Jared Diamond, suitable for readers who want to explore history and apply its ideas in study, work, or personal thinking." },
//     { title: "The Silk Roads", author: "Peter Frankopan", publisher: "Bloomsbury", isbn13: "9798600000612", publicationYear: 2015, pageCount: 636, categorySlugs: ["history"], priceVnd: 360000, descriptionVi: "The Silk Roads là một tựa sách nổi bật của Peter Frankopan, phù hợp cho độc giả muốn đào sâu chủ đề lịch sử và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Silk Roads is a notable book by Peter Frankopan, suitable for readers who want to explore history and apply its ideas in study, work, or personal thinking." },
//     { title: "A Brief History of Time", author: "Stephen Hawking", publisher: "Bantam", isbn13: "9798600000629", publicationYear: 1998, pageCount: 212, categorySlugs: ["mind-society"], priceVnd: 240000, descriptionVi: "A Brief History of Time là một tựa sách nổi bật của Stephen Hawking, phù hợp cho độc giả muốn đào sâu chủ đề tâm trí và xã hội và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "A Brief History of Time is a notable book by Stephen Hawking, suitable for readers who want to explore mind society and apply its ideas in study, work, or personal thinking." },
//     { title: "Cosmos", author: "Carl Sagan", publisher: "Random House", isbn13: "9798600000636", publicationYear: 1980, pageCount: 384, categorySlugs: ["mind-society"], priceVnd: 280000, descriptionVi: "Cosmos là một tựa sách nổi bật của Carl Sagan, phù hợp cho độc giả muốn đào sâu chủ đề tâm trí và xã hội và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Cosmos is a notable book by Carl Sagan, suitable for readers who want to explore mind society and apply its ideas in study, work, or personal thinking." },
//     { title: "The Selfish Gene", author: "Richard Dawkins", publisher: "Oxford University Press", isbn13: "9798600000643", publicationYear: 2016, pageCount: 496, categorySlugs: ["mind-society"], priceVnd: 300000, descriptionVi: "The Selfish Gene là một tựa sách nổi bật của Richard Dawkins, phù hợp cho độc giả muốn đào sâu chủ đề tâm trí và xã hội và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Selfish Gene is a notable book by Richard Dawkins, suitable for readers who want to explore mind society and apply its ideas in study, work, or personal thinking." },
//     { title: "Predictably Irrational", author: "Dan Ariely", publisher: "Harper", isbn13: "9798600000650", publicationYear: 2008, pageCount: 304, categorySlugs: ["psychology"], priceVnd: 250000, descriptionVi: "Predictably Irrational là một tựa sách nổi bật của Dan Ariely, phù hợp cho độc giả muốn đào sâu chủ đề tâm lý học và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Predictably Irrational is a notable book by Dan Ariely, suitable for readers who want to explore psychology and apply its ideas in study, work, or personal thinking." },
//     { title: "The Righteous Mind", author: "Jonathan Haidt", publisher: "Pantheon", isbn13: "9798600000667", publicationYear: 2012, pageCount: 448, categorySlugs: ["psychology", "social-issues"], priceVnd: 290000, descriptionVi: "The Righteous Mind là một tựa sách nổi bật của Jonathan Haidt, phù hợp cho độc giả muốn đào sâu chủ đề tâm lý học và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Righteous Mind is a notable book by Jonathan Haidt, suitable for readers who want to explore psychology and apply its ideas in study, work, or personal thinking." },
//     { title: "Man's Search for Meaning", author: "Viktor E. Frankl", publisher: "Beacon Press", isbn13: "9798600000674", publicationYear: 2006, pageCount: 184, categorySlugs: ["psychology", "philosophy"], priceVnd: 220000, descriptionVi: "Man's Search for Meaning là một tựa sách nổi bật của Viktor E. Frankl, phù hợp cho độc giả muốn đào sâu chủ đề tâm lý học và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Man's Search for Meaning is a notable book by Viktor E. Frankl, suitable for readers who want to explore psychology and apply its ideas in study, work, or personal thinking." },
//     { title: "The Art of War", author: "Sun Tzu", publisher: "Oxford University Press", isbn13: "9798600000681", publicationYear: -500, pageCount: 100, categorySlugs: ["philosophy", "history"], priceVnd: 180000, descriptionVi: "The Art of War là một tựa sách nổi bật của Sun Tzu, phù hợp cho độc giả muốn đào sâu chủ đề triết học và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Art of War is a notable book by Sun Tzu, suitable for readers who want to explore philosophy and apply its ideas in study, work, or personal thinking." },
//     { title: "Meditations", author: "Marcus Aurelius", publisher: "Modern Library", isbn13: "9798600000698", publicationYear: 2002, pageCount: 256, categorySlugs: ["philosophy"], priceVnd: 200000, descriptionVi: "Meditations là một tựa sách nổi bật của Marcus Aurelius, phù hợp cho độc giả muốn đào sâu chủ đề triết học và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Meditations is a notable book by Marcus Aurelius, suitable for readers who want to explore philosophy and apply its ideas in study, work, or personal thinking." },
//     { title: "The Republic", author: "Plato", publisher: "Penguin Classics", isbn13: "9798600000704", publicationYear: 2007, pageCount: 416, categorySlugs: ["philosophy"], priceVnd: 220000, descriptionVi: "The Republic là một tựa sách nổi bật của Plato, phù hợp cho độc giả muốn đào sâu chủ đề triết học và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Republic is a notable book by Plato, suitable for readers who want to explore philosophy and apply its ideas in study, work, or personal thinking." },
//     { title: "The Stranger", author: "Albert Camus", publisher: "Vintage", isbn13: "9798600000711", publicationYear: 1989, pageCount: 123, categorySlugs: ["fiction", "philosophy"], priceVnd: 190000, descriptionVi: "The Stranger là một tựa sách nổi bật của Albert Camus, phù hợp cho độc giả muốn đào sâu chủ đề tiểu thuyết và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Stranger is a notable book by Albert Camus, suitable for readers who want to explore fiction and apply its ideas in study, work, or personal thinking." },
//     { title: "Nineteen Eighty-Four", author: "George Orwell", publisher: "Secker & Warburg", isbn13: "9798600000728", publicationYear: 1949, pageCount: 328, categorySlugs: ["fiction", "social-issues"], priceVnd: 210000, descriptionVi: "Nineteen Eighty-Four là một tựa sách nổi bật của George Orwell, phù hợp cho độc giả muốn đào sâu chủ đề tiểu thuyết và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Nineteen Eighty-Four is a notable book by George Orwell, suitable for readers who want to explore fiction and apply its ideas in study, work, or personal thinking." },
//     { title: "Animal Farm", author: "George Orwell", publisher: "Secker & Warburg", isbn13: "9798600000735", publicationYear: 1945, pageCount: 112, categorySlugs: ["fiction", "social-issues"], priceVnd: 180000, descriptionVi: "Animal Farm là một tựa sách nổi bật của George Orwell, phù hợp cho độc giả muốn đào sâu chủ đề tiểu thuyết và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Animal Farm is a notable book by George Orwell, suitable for readers who want to explore fiction and apply its ideas in study, work, or personal thinking." },
//     { title: "To Kill a Mockingbird", author: "Harper Lee", publisher: "J. B. Lippincott & Co.", isbn13: "9798600000742", publicationYear: 1960, pageCount: 336, categorySlugs: ["fiction"], priceVnd: 220000, descriptionVi: "To Kill a Mockingbird là một tựa sách nổi bật của Harper Lee, phù hợp cho độc giả muốn đào sâu chủ đề tiểu thuyết và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "To Kill a Mockingbird is a notable book by Harper Lee, suitable for readers who want to explore fiction and apply its ideas in study, work, or personal thinking." },
//     { title: "The Great Gatsby", author: "F. Scott Fitzgerald", publisher: "Charles Scribner's Sons", isbn13: "9798600000759", publicationYear: 1925, pageCount: 180, categorySlugs: ["fiction"], priceVnd: 190000, descriptionVi: "The Great Gatsby là một tựa sách nổi bật của F. Scott Fitzgerald, phù hợp cho độc giả muốn đào sâu chủ đề tiểu thuyết và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Great Gatsby is a notable book by F. Scott Fitzgerald, suitable for readers who want to explore fiction and apply its ideas in study, work, or personal thinking." },
//     { title: "Norwegian Wood", author: "Haruki Murakami", publisher: "Kodansha", isbn13: "9798600000766", publicationYear: 1987, pageCount: 296, categorySlugs: ["fiction"], priceVnd: 240000, descriptionVi: "Norwegian Wood là một tựa sách nổi bật của Haruki Murakami, phù hợp cho độc giả muốn đào sâu chủ đề tiểu thuyết và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "Norwegian Wood is a notable book by Haruki Murakami, suitable for readers who want to explore fiction and apply its ideas in study, work, or personal thinking." },
//     { title: "The Kite Runner", author: "Khaled Hosseini", publisher: "Riverhead Books", isbn13: "9798600000773", publicationYear: 2003, pageCount: 371, categorySlugs: ["fiction"], priceVnd: 230000, descriptionVi: "The Kite Runner là một tựa sách nổi bật của Khaled Hosseini, phù hợp cho độc giả muốn đào sâu chủ đề tiểu thuyết và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Kite Runner is a notable book by Khaled Hosseini, suitable for readers who want to explore fiction and apply its ideas in study, work, or personal thinking." },
//     { title: "The Alchemist", author: "Paulo Coelho", publisher: "HarperOne", isbn13: "9798600000780", publicationYear: 1993, pageCount: 208, categorySlugs: ["fiction", "philosophy"], priceVnd: 210000, descriptionVi: "The Alchemist là một tựa sách nổi bật của Paulo Coelho, phù hợp cho độc giả muốn đào sâu chủ đề tiểu thuyết và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Alchemist is a notable book by Paulo Coelho, suitable for readers who want to explore fiction and apply its ideas in study, work, or personal thinking." },
//     { title: "The Little Prince", author: "Antoine de Saint-Exupéry", publisher: "Reynal & Hitchcock", isbn13: "9798600000797", publicationYear: 1943, pageCount: 96, categorySlugs: ["children-ya", "fiction"], priceVnd: 180000, descriptionVi: "The Little Prince là một tựa sách nổi bật của Antoine de Saint-Exupéry, phù hợp cho độc giả muốn đào sâu chủ đề thiếu nhi và tuổi mới lớn và áp dụng vào học tập, công việc hoặc tư duy cá nhân.", descriptionEn: "The Little Prince is a notable book by Antoine de Saint-Exupéry, suitable for readers who want to explore children ya and apply its ideas in study, work, or personal thinking." },
// ];

// type SeededBookVariant = {
//     id: number;
//     bookId: number;
//     format: BookFormat;
//     price: number;
//     isbn: string;
// };

// async function upsertAuthorByName(defaultName: string) {
//     const existing = await prisma.author.findFirst({
//         where: { defaultName },
//         select: { id: true },
//     });
//     if (existing) return existing.id;

//     const created = await prisma.author.create({
//         data: { defaultName },
//         select: { id: true },
//     });
//     return created.id;
// }

// async function upsertPublisherByName(defaultName: string) {
//     const existing = await prisma.publisher.findFirst({
//         where: { defaultName },
//         select: { id: true },
//     });
//     if (existing) return existing.id;

//     const created = await prisma.publisher.create({
//         data: { defaultName },
//         select: { id: true },
//     });
//     return created.id;
// }

// function splitAuthors(authorText: string) {
//     return authorText
//         .split(',')
//         .map((item) => item.trim())
//         .filter(Boolean);
// }

// function formatsForBook(bookIndex: number) {
//     if (bookIndex % 11 === 0) return [BookFormat.PAPERBACK];
//     if (bookIndex % 7 === 0) return [BookFormat.HARDCOVER, BookFormat.AUDIOBOOK];
//     if (bookIndex % 5 === 0) return [BookFormat.PAPERBACK, BookFormat.HARDCOVER, BookFormat.EBOOK];
//     if (bookIndex % 4 === 0) return [BookFormat.PAPERBACK, BookFormat.EBOOK];
//     if (bookIndex % 3 === 0) return [BookFormat.PAPERBACK, BookFormat.HARDCOVER];
//     return [BookFormat.PAPERBACK];
// }

// function badgeForBook(bookIndex: number) {
//     const mod = bookIndex % 10;
//     if (mod === 0) return Badge.BESTSELLER;
//     if (mod === 1) return Badge.NEW;
//     if (mod === 2) return Badge.LIMITED;
//     if (mod === 3) return Badge.EDITION;
//     return null;
// }

// function isBookActive(bookIndex: number) {
//     // Có chủ đích tạo một số sách inactive để test nghiệp vụ:
//     // book inactive => mọi variant không có costPrice/price.
//     return bookIndex % 13 !== 0;
// }

// function priceForFormat(basePrice: number, format: BookFormat) {
//     const multiplier =
//         format === BookFormat.HARDCOVER
//             ? 1.35
//             : format === BookFormat.EBOOK
//                 ? 0.65
//                 : format === BookFormat.AUDIOBOOK
//                     ? 1.1
//                     : 1;
//     return toRoundedVnd(basePrice * multiplier);
// }

// async function upsertCatalogBooks(
//     languageIdByCode: Map<string, number>,
//     categoryIdBySlug: Map<string, number>,
//     supplierIdByCode: Map<string, number>,
//     createdBy?: number,
// ) {
//     const viLanguageId = languageIdByCode.get('vi');
//     const enLanguageId = languageIdByCode.get('en');
//     if (!viLanguageId || !enLanguageId) throw new Error('Missing vi/en language seed');

//     const supplierIds = [...supplierIdByCode.values()];
//     if (!supplierIds.length) throw new Error('Missing supplier seed');

//     const seededVariants: SeededBookVariant[] = [];
//     const seededBookIds: number[] = [];
//     const maxBooks = 200;

//     for (let index = 0; index < Math.min(maxBooks, BOOKS.length); index += 1) {
//         const book = BOOKS[index];
//         const active = isBookActive(index);
//         const slug = `${slugify(book.title)}-${book.isbn13.slice(-6)}`;
//         const coverImageUrl = COVER_IMAGE_URLS[index % COVER_IMAGE_URLS.length] ?? `https://picsum.photos/seed/book-${book.isbn13}/720/1080`;
//         const galleryImageUrl = COVER_IMAGE_URLS[(index + 37) % COVER_IMAGE_URLS.length] ?? coverImageUrl;
//         const publisherId = await upsertPublisherByName(book.publisher);
//         const weightGrams = Math.max(120, 180 + Math.round(book.pageCount * 1.4));

//         const existingTranslation = await prisma.bookTranslation.findFirst({
//             where: { languageId: enLanguageId, slug },
//             select: { bookId: true },
//         });

//         let bookId: number;
//         if (existingTranslation) {
//             bookId = existingTranslation.bookId;
//             await prisma.book.update({
//                 where: { id: bookId },
//                 data: {
//                     publisherId,
//                     publicationYear: book.publicationYear,
//                     weightGrams,
//                     pageCount: book.pageCount,
//                     coverImageUrl,
//                     isActive: active,
//                     deletedAt: null,
//                     updatedBy: createdBy,
//                 },
//             });
//         } else {
//             const created = await prisma.book.create({
//                 data: {
//                     publisherId,
//                     publicationYear: book.publicationYear,
//                     weightGrams,
//                     pageCount: book.pageCount,
//                     coverImageUrl,
//                     isActive: active,
//                     createdBy,
//                     updatedBy: createdBy,
//                 },
//                 select: { id: true },
//             });
//             bookId = created.id;
//         }

//         seededBookIds.push(bookId);

//         await prisma.bookTranslation.upsert({
//             where: { bookId_languageId: { bookId, languageId: enLanguageId } },
//             update: {
//                 title: book.title,
//                 description: book.descriptionEn,
//                 slug,
//             },
//             create: {
//                 bookId,
//                 languageId: enLanguageId,
//                 title: book.title,
//                 description: book.descriptionEn,
//                 slug,
//             },
//         });

//         await prisma.bookTranslation.upsert({
//             where: { bookId_languageId: { bookId, languageId: viLanguageId } },
//             update: {
//                 title: book.titleVi ?? book.title,
//                 description: book.descriptionVi,
//                 slug,
//             },
//             create: {
//                 bookId,
//                 languageId: viLanguageId,
//                 title: book.titleVi ?? book.title,
//                 description: book.descriptionVi,
//                 slug,
//             },
//         });

//         await prisma.bookAuthor.deleteMany({ where: { bookId } });
//         const authors = splitAuthors(book.author);
//         for (let authorIndex = 0; authorIndex < authors.length; authorIndex += 1) {
//             const authorId = await upsertAuthorByName(authors[authorIndex]);
//             await prisma.bookAuthor.upsert({
//                 where: { bookId_authorId: { bookId, authorId } },
//                 update: { isPrimary: authorIndex === 0 },
//                 create: {
//                     bookId,
//                     authorId,
//                     isPrimary: authorIndex === 0,
//                 },
//             });
//         }

//         await prisma.bookCategory.deleteMany({ where: { bookId } });
//         const categoryIds = book.categorySlugs
//             .map((categorySlug) => categoryIdBySlug.get(categorySlug))
//             .filter((id): id is number => Boolean(id));

//         if (categoryIds.length) {
//             await prisma.bookCategory.createMany({
//                 data: categoryIds.map((categoryId) => ({ bookId, categoryId })),
//                 skipDuplicates: true,
//             });
//         }

//         await prisma.bookSpec.upsert({
//             where: { bookId },
//             update: {
//                 widthCm: 14,
//                 heightCm: 20.5,
//                 thicknessCm: Math.max(0.6, Math.round((book.pageCount / 360) * 100) / 100),
//                 packaging: active ? 'Bọc màng co tiêu chuẩn' : 'Ngừng kinh doanh',
//             },
//             create: {
//                 bookId,
//                 widthCm: 14,
//                 heightCm: 20.5,
//                 thicknessCm: Math.max(0.6, Math.round((book.pageCount / 360) * 100) / 100),
//                 packaging: active ? 'Bọc màng co tiêu chuẩn' : 'Ngừng kinh doanh',
//             },
//         });

//         const badge = active ? badgeForBook(index) : null;
//         if (badge) {
//             await prisma.bookBadge.upsert({
//                 where: { bookId },
//                 update: { code: badge },
//                 create: { bookId, code: badge },
//             });
//         } else {
//             await prisma.bookBadge.deleteMany({ where: { bookId } });
//         }

//         await prisma.bookVariantAsset.deleteMany({ where: { bookId } });
//         await prisma.bookVariantAsset.createMany({
//             data: [
//                 { bookId, url: coverImageUrl, assetType: 'COVER', sortOrder: 0 },
//                 { bookId, url: galleryImageUrl, assetType: 'GALLERY', sortOrder: 1 },
//             ],
//         });

//         const formats = formatsForBook(index);
//         for (let variantIndex = 0; variantIndex < formats.length; variantIndex += 1) {
//             const format = formats[variantIndex];
//             const price = active ? priceForFormat(book.priceVnd, format) : null;
//             const costPrice = active && price ? toRoundedVnd(price * 0.58) : null;
//             const isDigital = format === BookFormat.EBOOK || format === BookFormat.AUDIOBOOK;
//             const stock = active ? (isDigital ? 999 : physicalStockForBook(index + variantIndex)) : 0;
//             const reserved = active && !isDigital && stock > 20 ? randomInt(0, 5) : 0;
//             const available = Math.max(0, stock - reserved);
//             const supplierId = active && !isDigital ? randomOne(supplierIds) : null;
//             const isbn = makeVariantIsbn(book, index, variantIndex);

//             const variant = await prisma.bookVariant.upsert({
//                 where: { bookId_format_edition: { bookId, format, edition: 1 } },
//                 update: {
//                     isbn,
//                     costPrice,
//                     price,
//                     currencyCode: CURRENCY_CODE_VND,
//                     stock,
//                     available,
//                     reserved,
//                     isActive: active,
//                     supplierId,
//                 },
//                 create: {
//                     bookId,
//                     format,
//                     edition: 1,
//                     isbn,
//                     costPrice,
//                     price,
//                     currencyCode: CURRENCY_CODE_VND,
//                     stock,
//                     available,
//                     reserved,
//                     isActive: active,
//                     supplierId,
//                 },
//                 select: {
//                     id: true,
//                     bookId: true,
//                     format: true,
//                     price: true,
//                     isbn: true,
//                 },
//             });

//             if (active && variant.price !== null) {
//                 seededVariants.push({
//                     id: variant.id,
//                     bookId: variant.bookId,
//                     format: variant.format,
//                     price: Number(variant.price),
//                     isbn: variant.isbn,
//                 });
//             }
//         }
//     }

//     return {
//         bookIds: seededBookIds,
//         variants: seededVariants,
//     };
// }

// async function upsertVariantSnapshots(variants: SeededBookVariant[]) {
//     let snapshotCount = 0;

//     for (const variant of variants) {
//         const contentHash = `seed-snapshot-${variant.id}-${variant.price}`;
//         const existing = await prisma.bookVariantSnapshot.findUnique({
//             where: { contentHash },
//             select: { id: true },
//         });

//         const data = {
//             bookVariantId: variant.id,
//             contentHash,
//             priceSnapshot: variant.price,
//             currencyCodeSnapshot: CURRENCY_CODE_VND,
//             formatSnapshot: variant.format,
//             isbnSnapshot: variant.isbn,
//         };

//         if (existing) {
//             await prisma.bookVariantSnapshot.update({
//                 where: { id: existing.id },
//                 data,
//             });
//         } else {
//             await prisma.bookVariantSnapshot.create({ data });
//         }

//         snapshotCount += 1;
//     }

//     return snapshotCount;
// }

// // =============================================================================
// // Main
// // =============================================================================

// async function main() {
//     console.log('--- Seeding RBAC ---');
//     const roleIdByCode = await upsertRoles();
//     const permissionIdByCode = await upsertPermissions();
//     await seedRolePermissions(roleIdByCode, permissionIdByCode);

//     console.log('--- Seeding suppliers/languages/users/categories ---');
//     const supplierIdByCode = await upsertSuppliers();
//     const languageIdByCode = await upsertLanguages();
//     const { admin } = await seedUsers(roleIdByCode);
//     const categoryIdBySlug = await upsertCategories(languageIdByCode, admin?.id);

//     console.log('--- Seeding catalog books ---');
//     const { bookIds, variants } = await upsertCatalogBooks(
//         languageIdByCode,
//         categoryIdBySlug,
//         supplierIdByCode,
//         admin?.id,
//     );
//     const snapshotCount = await upsertVariantSnapshots(variants);

//     const activeBooks = bookIds.filter((_, index) => isBookActive(index)).length;
//     const inactiveBooks = bookIds.length - activeBooks;
//     console.log(`Books seeded: ${bookIds.length} (${activeBooks} active, ${inactiveBooks} inactive)`);
//     console.log(`Active variants seeded: ${variants.length}`);
//     console.log(`Variant snapshots seeded: ${snapshotCount}`);
//     console.log('--- Seed completed successfully ---');
// }

// main()
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });
