// prisma/seed.ts
//
// Seed dữ liệu thật cho bookstore theo ĐÚNG nghiệp vụ nhập hàng:
//
// 1) ADMIN TẠO SẢN PHẨM (draft):
//    - Admin tạo Book trước.
//    - Nếu Book có format thì tạo BookVariant tương ứng.
//    - Variant khi tạo LUÔN chưa có giá (price = null),
//      chưa có tồn kho (stock = available = reserved = 0) và isActive = false.
//    - Nếu Book không có format/variant thì chỉ seed Book, KHÔNG seed BookVariant,
//      và Book.isActive = false.
//
// 2) SALE/ADMIN TẠO ĐƠN MUA (PurchaseOrder + PurchaseOrderItem):
//    - Mỗi PurchaseOrderItem có: quantity (số lượng đặt), unitPrice (giá niêm yết
//      nhà cung cấp báo), discountPrice (TỶ LỆ CHIẾT KHẤU DẠNG SỐ NGUYÊN, ví dụ 50
//      nghĩa là 50%, KHÔNG lưu dạng phân số 0.5), price (giá nhập sau chiết khấu =
//      unitPrice * (1 - discountPrice/100)), totalPrice = price * quantity.
//    - Giá nhập nằm ở PurchaseOrderItem.price, không lưu giá vốn trong BookVariant.
//    - Khi vừa tạo: PurchaseOrder.status = PENDING, statusTransfer = PENDING.
//
// 3) ADMIN DUYỆT ĐƠN:
//    - status: PENDING -> APPROVED (approvedById, approvedAt được set).
//    - statusTransfer vẫn là PENDING (đơn đã duyệt nhưng kho chưa xử lý nhập).
//
// 4) SALE/KHO XỬ LÝ NHẬP KHO:
//    - statusTransfer: PENDING -> PROCESSING (đang xử lý nhập hàng thực tế).
//    - Khi nhập xong, tạo StockImport (1-1 với PurchaseOrder) gồm StockImportItem
//      cho từng PurchaseOrderItem: nhận note, realQuantity (số lượng thực nhận để
//      đối chiếu) và lackQuantity (thiếu hụt nếu có).
//    - Nếu nhập thành công: BookVariant.stock/available CỘNG DỒN theo realQuantity.
//    - statusTransfer: PROCESSING -> PURCHASE (đã hoàn tất nhập).
//
// 5) ADMIN QUYẾT ĐỊNH GIÁ BÁN:
//    - Một variant có thể được nhập qua NHIỀU đợt (nhiều PurchaseOrder khác nhau,
//      từ nhiều nhà cung cấp / chiết khấu khác nhau).
//    - Hệ thống có thể xem các PurchaseOrderItem đã nhập kho của variant đó để tham
//      chiếu giá nhập, nhưng BookVariant chỉ lưu price bán ra.
//    - Nếu đã có tồn kho nhưng admin CHƯA chốt giá bán thì BookVariant.price = null
//      và BookVariant.isActive = false (không bán được dù đã có hàng).
//
// Chạy:
//   npx tsx prisma/seed.ts
// hoặc:
//   npx prisma db seed

import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  AddressType,
  Badge,
  BookFormat,
  CurrencyCode,
  HTTPMethod,
  PrismaClient,
  PurchaseOrderStatus,
  PurchaseOrderType,
  RoleCode,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const connectionConfig: any =
  process.env.DATABASE_URL ??
  ({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3308),
    user: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD ?? 'huy123',
    database: process.env.DB_NAME ?? 'book_store',
    connectionLimit: 5,
  } as const);

const adapter = new PrismaMariaDb(connectionConfig);
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

function toMoney(value: number) {
  return Number(value.toFixed(2));
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

function isbn13FromSeed(seed: number) {
  const body = `979${String(seed).padStart(9, '0').slice(-9)}`;
  const sum = body
    .split('')
    .reduce(
      (acc, digit, index) => acc + Number(digit) * (index % 2 === 0 ? 1 : 3),
      0,
    );
  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}

function makeVariantIsbn(
  book: SeedBook,
  bookIndex: number,
  variantIndex: number,
) {
  if (variantIndex === 0) return book.isbn13;
  return isbn13FromSeed(900000000 + bookIndex * 10 + variantIndex);
}

function physicalStockForBook(seed: number) {
  const stocks = [10, 20, 35, 50, 75, 100, 120, 150, 180, 200];
  return stocks[Math.abs(seed) % stocks.length];
}

// Tỷ lệ chiết khấu nhập hàng, lưu dưới dạng SỐ NGUYÊN phần trăm (50 nghĩa là 50%),
// KHÔNG lưu dạng phân số (0.5). netUnitPrice = unitPrice * (1 - discountPercent/100).
function discountPercentForBatch(seed: number) {
  const rates = [10, 15, 20, 25, 30, 35, 40, 45, 50];
  return rates[Math.abs(seed) % rates.length];
}

const CURRENCY_CODE_VND = CurrencyCode.VND;
const CUSTOMER_COUNT = 36;
const BOOK_COUNT = 200;

// =============================================================================
// Permissions + Roles + RolePermissions
// =============================================================================

type PermissionSeed = {
  code: PermissionCode;
  method: HTTPMethod;
  pathPattern: string;
  description: string;
  isActive?: boolean;
};

const PERMISSIONS: PermissionSeed[] = [
  {
    code: PermissionCode.GUEST_SESSION_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/guest-session',
    description: 'Read guest sessions',
  },

  {
    code: PermissionCode.ROLE_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/role',
    description: 'List roles',
  },

  {
    code: PermissionCode.PERMISSION_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/permission',
    description: 'List permissions',
  },
  {
    code: PermissionCode.PERMISSION_UPDATE,
    method: HTTPMethod.PATCH,
    pathPattern: '/api/v1/permission/:id',
    description: 'Update permission',
  },

  {
    code: PermissionCode.ROLE_PERMISSION_GRANT,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/role-permission',
    description: 'Grant permission to role',
  },
  {
    code: PermissionCode.ROLE_PERMISSION_READ_BY_ROLE,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/role-permission/role/:roleId',
    description: 'List permissions of a role',
  },
  {
    code: PermissionCode.ROLE_PERMISSION_READ_BY_PERMISSION,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/role-permission/permission/:permissionId',
    description: 'List roles that have a permission',
  },

  {
    code: PermissionCode.DEVICE_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/auth/device/:userId',
    description: 'List active device sessions by user id',
  },
  {
    code: PermissionCode.EMAIL_OUTBOX_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/email-outbox',
    description: 'List email outbox by filter',
  },
  {
    code: PermissionCode.SEARCH_REINDEX_BOOKS,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/search/reindex',
    description: 'Reindex search vectors in Pinecone',
  },

  {
    code: PermissionCode.AUTHOR_CREATE,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/authors',
    description: 'Create author',
  },
  {
    code: PermissionCode.PUBLISHER_CREATE,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/publishers',
    description: 'Create publisher',
  },
  {
    code: PermissionCode.CATEGORY_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/admin/categories/stats',
    description: 'Read category statistics',
  },
  {
    code: PermissionCode.CATEGORY_CREATE,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/categories',
    description: 'Create category',
  },

  {
    code: PermissionCode.SUPPLIER_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/suppliers',
    description: 'List suppliers',
  },
  {
    code: PermissionCode.SUPPLIER_CREATE,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/suppliers',
    description: 'Create supplier',
  },
  {
    code: PermissionCode.SUPPLIER_UPDATE,
    method: HTTPMethod.PATCH,
    pathPattern: '/api/v1/suppliers/:supplierId/active',
    description: 'Toggle supplier active status',
  },

  {
    code: PermissionCode.BOOK_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/admin/books/*',
    description: 'Read books in admin workflows',
  },
  {
    code: PermissionCode.BOOK_CREATE,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/admin/books',
    description: 'Create book',
  },
  {
    code: PermissionCode.BOOK_UPDATE,
    method: HTTPMethod.PATCH,
    pathPattern: '/api/v1/admin/books/:bookId',
    description: 'Update book',
  },
  {
    code: PermissionCode.BOOK_DELETE,
    method: HTTPMethod.DELETE,
    pathPattern: '/api/v1/admin/books/:bookId',
    description: 'Soft delete book',
  },
  {
    code: PermissionCode.BOOK_TRANSLATION_CREATE,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/admin/books/:bookId/translations',
    description: 'Create book translation',
  },
  {
    code: PermissionCode.BOOK_SNAPSHOT_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/admin/book-snapshots',
    description: 'List book snapshots',
  },

  {
    code: PermissionCode.BOOK_VARIANT_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/admin/book-variants',
    description: 'List book variants',
  },
  {
    code: PermissionCode.BOOK_VARIANT_UPDATE,
    method: HTTPMethod.PATCH,
    pathPattern: '/api/v1/admin/book-variants/:variantId',
    description: 'Update book variant',
  },

  {
    code: PermissionCode.ORDER_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/admin/orders/*',
    description: 'Read orders in admin workflows',
  },
  {
    code: PermissionCode.ORDER_UPDATE,
    method: HTTPMethod.PATCH,
    pathPattern: '/api/v1/admin/orders/:orderId/status',
    description: 'Update order status',
  },

  {
    code: PermissionCode.PURCHASE_ORDER_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/purchase-orders/*',
    description: 'Read purchase orders',
  },
  {
    code: PermissionCode.PURCHASE_ORDER_CREATE,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/purchase-orders',
    description: 'Create purchase order',
  },
  {
    code: PermissionCode.PURCHASE_ORDER_APPROVE,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/purchase-orders/:purchaseOrderId/approve',
    description: 'Approve or reject purchase order',
  },
  {
    code: PermissionCode.PURCHASE_ORDER_TRANSFER,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/purchase-orders/:purchaseOrderId/transfer-processing',
    description: 'Transfer purchase order to processing',
  },

  {
    code: PermissionCode.STOCK_IMPORT_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/admin/stock-imports/*',
    description: 'Read stock imports',
  },
  {
    code: PermissionCode.STOCK_IMPORT_CREATE,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/admin/stock-imports/create',
    description: 'Create stock import',
  },

  {
    code: PermissionCode.USER_READ,
    method: HTTPMethod.GET,
    pathPattern: '/api/v1/admin/users/*',
    description: 'Read users in admin workflows',
  },

  {
    code: PermissionCode.UPLOAD_MANAGE,
    method: HTTPMethod.POST,
    pathPattern: '/api/v1/uploads/*',
    description: 'Upload files and confirm book assets',
  },
];

const STAFF_PERMISSIONS: PermissionCode[] = [
  PermissionCode.SUPPLIER_READ,
  PermissionCode.SUPPLIER_CREATE,
  PermissionCode.SUPPLIER_UPDATE,
  PermissionCode.AUTHOR_CREATE,
  PermissionCode.PUBLISHER_CREATE,
  PermissionCode.CATEGORY_READ,
  PermissionCode.CATEGORY_CREATE,
  PermissionCode.BOOK_READ,
  PermissionCode.BOOK_CREATE,
  PermissionCode.BOOK_UPDATE,
  PermissionCode.BOOK_DELETE,
  PermissionCode.BOOK_TRANSLATION_CREATE,
  PermissionCode.BOOK_SNAPSHOT_READ,
  PermissionCode.BOOK_VARIANT_READ,
  PermissionCode.BOOK_VARIANT_UPDATE,
  PermissionCode.ORDER_READ,
  PermissionCode.ORDER_UPDATE,
  PermissionCode.PURCHASE_ORDER_READ,
  PermissionCode.PURCHASE_ORDER_CREATE,
  PermissionCode.PURCHASE_ORDER_APPROVE,
  PermissionCode.PURCHASE_ORDER_TRANSFER,
  PermissionCode.STOCK_IMPORT_READ,
  PermissionCode.STOCK_IMPORT_CREATE,
  PermissionCode.USER_READ,
  PermissionCode.UPLOAD_MANAGE,
  PermissionCode.DEVICE_READ,
  PermissionCode.EMAIL_OUTBOX_READ,
  PermissionCode.GUEST_SESSION_READ,
  PermissionCode.SEARCH_REINDEX_BOOKS,
];

const WAREHOUSE_PERMISSIONS: PermissionCode[] = [
  PermissionCode.SUPPLIER_READ,
  PermissionCode.BOOK_READ,
  PermissionCode.BOOK_VARIANT_READ,
  PermissionCode.BOOK_VARIANT_UPDATE,
  PermissionCode.PURCHASE_ORDER_READ,
  PermissionCode.PURCHASE_ORDER_TRANSFER,
  PermissionCode.STOCK_IMPORT_READ,
  PermissionCode.STOCK_IMPORT_CREATE,
  PermissionCode.UPLOAD_MANAGE,
];

const CUSTOMER_PERMISSIONS: PermissionCode[] = [];
const GUEST_PERMISSIONS: PermissionCode[] = [];
const ALL_PERMISSION_CODES: PermissionCode[] = Object.values(
  PermissionCode,
) as PermissionCode[];

const ROLE_PERMISSION_MAP: Record<RoleCode, PermissionCode[]> = {
  [RoleCode.ADMIN]: ALL_PERMISSION_CODES,
  [RoleCode.STAFF]: STAFF_PERMISSIONS,
  [RoleCode.WAREHOUSE]: WAREHOUSE_PERMISSIONS,
  [RoleCode.CUSTOMER]: CUSTOMER_PERMISSIONS,
  [RoleCode.GUEST]: GUEST_PERMISSIONS,
};

async function upsertRoles() {
  const roles = [
    { code: RoleCode.ADMIN, name: 'admin', description: 'Full system access' },
    {
      code: RoleCode.STAFF,
      name: 'staff',
      description: 'Backoffice catalog/order staff',
    },
    {
      code: RoleCode.WAREHOUSE,
      name: 'warehouse',
      description: 'Warehouse and stock staff',
    },
    {
      code: RoleCode.CUSTOMER,
      name: 'customer',
      description: 'Registered bookstore customer',
    },
    {
      code: RoleCode.GUEST,
      name: 'guest',
      description: 'Guest checkout role, no seeded user',
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isActive: true,
        deletedAt: null,
      },
      create: {
        code: role.code,
        name: role.name,
        description: role.description,
        isActive: true,
      },
    });
  }

  const rows = await prisma.role.findMany({ select: { id: true, code: true } });
  return new Map(rows.map((row) => [row.code, row.id] as const));
}

async function upsertPermissions() {
  const activeCodes = PERMISSIONS.map((permission) => permission.code);
  const obsoletePermissions = await prisma.permission.findMany({
    where: { code: { notIn: activeCodes } },
    select: { id: true },
  });
  const obsoletePermissionIds = obsoletePermissions.map(
    (permission) => permission.id,
  );

  if (obsoletePermissionIds.length > 0) {
    await prisma.rolePermission.deleteMany({
      where: { permissionId: { in: obsoletePermissionIds } },
    });
    await prisma.permission.deleteMany({
      where: { id: { in: obsoletePermissionIds } },
    });
  }

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        description: permission.description,
        method: permission.method,
        pathPattern: permission.pathPattern,
        isActive: permission.isActive ?? true,
        deletedAt: null,
      },
      create: {
        code: permission.code,
        description: permission.description,
        method: permission.method,
        pathPattern: permission.pathPattern,
        isActive: permission.isActive ?? true,
      },
    });
  }

  const rows = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  return new Map(
    rows.map((row) => [row.code as PermissionCode, row.id] as const),
  );
}

async function seedRolePermissions(
  roleIdByCode: Map<RoleCode, number>,
  permissionIdByCode: Map<PermissionCode, number>,
) {
  let totalGranted = 0;
  let totalSkipped = 0;

  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSION_MAP) as [
    RoleCode,
    PermissionCode[],
  ][]) {
    const roleId = roleIdByCode.get(roleCode);
    if (!roleId) {
      console.warn(`[role-permission] Skip role not found: ${roleCode}`);
      continue;
    }

    const uniqueCodes = [...new Set(permCodes)];
    const rolePermissionIds = uniqueCodes
      .map((permCode) => permissionIdByCode.get(permCode))
      .filter(
        (permissionId): permissionId is number => permissionId !== undefined,
      );

    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: { notIn: rolePermissionIds },
      },
    });

    for (const permCode of uniqueCodes) {
      const permissionId = permissionIdByCode.get(permCode);
      if (!permissionId) {
        console.warn(
          `[role-permission] Skip permission not found: ${permCode}`,
        );
        totalSkipped += 1;
        continue;
      }

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
      totalGranted += 1;
    }

    console.log(
      `Role ${roleCode.padEnd(12)} -> ${uniqueCodes.length} permissions`,
    );
  }

  console.log(
    `RolePermission seed done: ${totalGranted} granted, ${totalSkipped} skipped`,
  );
}

// =============================================================================
// Suppliers
// =============================================================================

type SupplierSeed = { code: string; name: string };

const SUPPLIERS: SupplierSeed[] = [
  {
    code: 'SUP-FAHASA',
    name: 'Công ty Cổ phần Phát hành Sách TP.HCM - Fahasa',
  },
  { code: 'SUP-PHUONGNAM', name: 'Công ty Sách Phương Nam' },
  { code: 'SUP-ALPHA', name: 'Alpha Books' },
  { code: 'SUP-THAIHA', name: 'Thái Hà Books' },
  { code: 'SUP-NHANAM', name: 'Nhã Nam' },
  { code: 'SUP-KIMDONG', name: 'Nhà xuất bản Kim Đồng' },
  { code: 'SUP-FIRSTNEWS', name: 'First News - Trí Việt' },
  { code: 'SUP-TRE', name: 'Nhà xuất bản Trẻ' },
  { code: 'SUP-OMEGA', name: 'Omega Plus Books' },
  { code: 'SUP-DINHTI', name: 'Đinh Tị Books' },
  { code: 'SUP-1980', name: '1980 Books' },
  { code: 'SUP-AZVIETNAM', name: 'AZ Việt Nam' },
  { code: 'SUP-PEARSON', name: 'Pearson Education Asia' },
  { code: 'SUP-OREILLY', name: "O'Reilly Media Wholesale" },
  { code: 'SUP-SPRINGER', name: 'Springer Nature SEA' },
  { code: 'SUP-PENGUIN', name: 'Penguin Random House SEA' },
  { code: 'SUP-HARPERCOLLINS', name: 'HarperCollins SEA' },
  { code: 'SUP-MCGRAW', name: 'McGraw Hill Education' },
  { code: 'SUP-OXFORD', name: 'Oxford University Press Distribution' },
  { code: 'SUP-CAMBRIDGE', name: 'Cambridge University Press Distribution' },
  { code: 'SUP-TIKI', name: 'Tiki Trading - Book Division' },
  { code: 'SUP-VINABOOK', name: 'Vinabook Distribution' },
];

async function upsertSuppliers() {
  for (const supplier of SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { code: supplier.code },
      update: {
        name: supplier.name,
        isActive: true,
      },
      create: {
        code: supplier.code,
        name: supplier.name,
        isActive: true,
      },
    });
  }

  const rows = await prisma.supplier.findMany({
    select: { id: true, code: true },
  });
  return new Map(rows.map((row) => [row.code, row.id] as const));
}

// =============================================================================
// Languages + Categories
// =============================================================================

async function upsertLanguages() {
  const languages = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
  ];

  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {
        name: language.name,
        isActive: true,
      },
      create: {
        code: language.code,
        name: language.name,
        isActive: true,
      },
    });
  }

  const rows = await prisma.language.findMany({
    select: { id: true, code: true },
  });
  return new Map(rows.map((row) => [row.code, row.id] as const));
}

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
    viDescription:
      'Nhóm sách về công nghệ hiện đại, gồm lập trình, vận hành hệ thống, bảo mật và dữ liệu.',
    enDescription:
      'Technology books covering programming, infrastructure, security, and modern data systems.',
  },
  {
    slug: 'programming',
    sortOrder: 2,
    parentSlug: 'technology',
    viName: 'Lập trình',
    enName: 'Programming',
    viDescription:
      'Sách tập trung kỹ thuật coding thực chiến, clean code, testing và tối ưu chất lượng phần mềm.',
    enDescription:
      'Hands-on coding books focused on clean code, testing, and practical engineering quality.',
  },
  {
    slug: 'software-architecture',
    sortOrder: 3,
    parentSlug: 'technology',
    viName: 'Kiến trúc phần mềm',
    enName: 'Software Architecture',
    viDescription:
      'Nội dung về kiến trúc hệ thống, phân rã domain, mở rộng và vận hành ổn định trên quy mô lớn.',
    enDescription:
      'Software architecture, domain boundaries, scalability, and resilient system design at scale.',
  },
  {
    slug: 'devops-cloud',
    sortOrder: 4,
    parentSlug: 'technology',
    viName: 'DevOps và Cloud',
    enName: 'DevOps & Cloud',
    viDescription:
      'Sách về CI/CD, container, cloud native và quản trị hạ tầng theo hướng tự động hóa.',
    enDescription:
      'DevOps and cloud-native books on CI/CD, containers, automation, and infrastructure operations.',
  },
  {
    slug: 'cybersecurity',
    sortOrder: 5,
    parentSlug: 'technology',
    viName: 'An toàn thông tin',
    enName: 'Cybersecurity',
    viDescription:
      'Kiến thức về phòng thủ ứng dụng, quản lý rủi ro và triển khai bảo mật trong vòng đời sản phẩm.',
    enDescription:
      'Cybersecurity practices for secure-by-design software, threat modeling, and risk management.',
  },
  {
    slug: 'data-ai',
    sortOrder: 6,
    parentSlug: 'technology',
    viName: 'Dữ liệu và AI',
    enName: 'Data & AI',
    viDescription:
      'Sách về data engineering, phân tích dữ liệu và ứng dụng machine learning cho bài toán thực tế.',
    enDescription:
      'Data engineering, analytics, and applied AI books for production-ready decision systems.',
  },

  {
    slug: 'business-economics',
    sortOrder: 7,
    viName: 'Kinh doanh và kinh tế',
    enName: 'Business & Economics',
    viDescription:
      'Nhóm sách về tăng trưởng doanh nghiệp, vận hành, chiến lược sản phẩm và mô hình tài chính.',
    enDescription:
      'Business and economics titles about growth, operations, product strategy, and financial models.',
  },
  {
    slug: 'entrepreneurship',
    sortOrder: 8,
    parentSlug: 'business-economics',
    viName: 'Khởi nghiệp',
    enName: 'Entrepreneurship',
    viDescription:
      'Sách cho nhà sáng lập: xác thực ý tưởng, tìm product-market fit và xây dựng đội ngũ ban đầu.',
    enDescription:
      'Entrepreneurship books on validation, product-market fit, and early team execution.',
  },
  {
    slug: 'management-leadership',
    sortOrder: 9,
    parentSlug: 'business-economics',
    viName: 'Quản trị và lãnh đạo',
    enName: 'Management & Leadership',
    viDescription:
      'Nội dung về vận hành đội ngũ, đánh giá hiệu suất, lập kế hoạch và ra quyết định lãnh đạo.',
    enDescription:
      'Management and leadership books on team operations, planning, feedback, and decision quality.',
  },
  {
    slug: 'marketing-sales',
    sortOrder: 10,
    parentSlug: 'business-economics',
    viName: 'Marketing và bán hàng',
    enName: 'Marketing & Sales',
    viDescription:
      'Sách hướng dẫn xây dựng thông điệp, kênh tiếp cận và hệ thống chuyển đổi doanh thu ổn định.',
    enDescription:
      'Books on positioning, channel strategy, and conversion-focused marketing and sales execution.',
  },
  {
    slug: 'finance-investing',
    sortOrder: 11,
    parentSlug: 'business-economics',
    viName: 'Tài chính và đầu tư',
    enName: 'Finance & Investing',
    viDescription:
      'Sách tài chính cá nhân, phân tích báo cáo tài chính và các nguyên tắc đầu tư bền vững.',
    enDescription:
      'Finance books covering personal money systems, statement analysis, and long-term investing.',
  },

  {
    slug: 'mind-society',
    sortOrder: 12,
    viName: 'Tâm trí và xã hội',
    enName: 'Mind & Society',
    viDescription:
      'Nhóm sách khai phá hành vi con người, bối cảnh xã hội và tư duy để hiểu sâu các quyết định.',
    enDescription:
      'Mind and society books exploring behavior, culture, institutions, and decision dynamics.',
  },
  {
    slug: 'psychology',
    sortOrder: 13,
    parentSlug: 'mind-society',
    viName: 'Tâm lý học',
    enName: 'Psychology',
    viDescription:
      'Sách tâm lý ứng dụng cho học tập, công việc và quản lý bản thân theo hướng thực hành.',
    enDescription:
      'Practical psychology books for habits, motivation, communication, and personal effectiveness.',
  },
  {
    slug: 'history',
    sortOrder: 14,
    parentSlug: 'mind-society',
    viName: 'Lịch sử',
    enName: 'History',
    viDescription:
      'Sách lịch sử theo hướng tổng hợp bối cảnh, nhân quả và bài học cho hiện tại.',
    enDescription:
      'History titles connecting context, causality, and practical lessons for current society.',
  },
  {
    slug: 'philosophy',
    sortOrder: 15,
    parentSlug: 'mind-society',
    viName: 'Triết học',
    enName: 'Philosophy',
    viDescription:
      'Sách triết học ứng dụng giúp làm rõ hệ giá trị, nâng cao năng lực lập luận và phản biện.',
    enDescription:
      'Applied philosophy books for reasoning, ethics, values, and structured critical thinking.',
  },
  {
    slug: 'social-issues',
    sortOrder: 16,
    parentSlug: 'mind-society',
    viName: 'Vấn đề xã hội',
    enName: 'Social Issues',
    viDescription:
      'Sách phân tích những thách thức xã hội đương đại như công dân số, đạo đức dữ liệu và AI.',
    enDescription:
      'Books on modern social issues such as digital citizenship, data ethics, and AI governance.',
  },

  {
    slug: 'literature-arts',
    sortOrder: 17,
    viName: 'Văn học và nghệ thuật',
    enName: 'Literature & Arts',
    viDescription:
      'Nhóm sách văn học với giá trị cảm xúc, ngôn ngữ và nghệ thuật kể chuyện.',
    enDescription:
      'Literature and arts books centered on narrative craft, language, and emotional depth.',
  },
  {
    slug: 'fiction',
    sortOrder: 18,
    parentSlug: 'literature-arts',
    viName: 'Tiểu thuyết',
    enName: 'Fiction',
    viDescription:
      'Tiểu thuyết đương đại và kinh điển, khắc họa nhân vật rõ nét và xung đột đầy sức nặng.',
    enDescription:
      'Fiction titles with strong character arcs, layered conflicts, and memorable narrative voice.',
  },
  {
    slug: 'short-stories',
    sortOrder: 19,
    parentSlug: 'literature-arts',
    viName: 'Truyện ngắn',
    enName: 'Short Stories',
    viDescription:
      'Tuyển tập truyện ngắn tinh gọn, giàu hình ảnh và một kết thúc có dư âm.',
    enDescription:
      'Short story collections with concise structure, vivid imagery, and resonant endings.',
  },
  {
    slug: 'children-ya',
    sortOrder: 20,
    parentSlug: 'literature-arts',
    viName: 'Thiếu nhi và tuổi mới lớn',
    enName: 'Children & YA',
    viDescription:
      'Sách cho thiếu nhi và tuổi mới lớn với tính giáo dục, trí tưởng tượng và lòng nhân ái.',
    enDescription:
      'Children and YA books blending imagination, empathy, and age-appropriate life lessons.',
  },

  {
    slug: 'education-skills',
    sortOrder: 21,
    viName: 'Học tập và kỹ năng',
    enName: 'Education & Skills',
    viDescription:
      'Nhóm sách hướng dẫn kỹ năng học tập, giao tiếp, ngoại ngữ và nâng cao năng lực cá nhân.',
    enDescription:
      'Education and skills books on learning methods, communication, language, and self-improvement.',
  },
  {
    slug: 'language-learning',
    sortOrder: 22,
    parentSlug: 'education-skills',
    viName: 'Học ngoại ngữ',
    enName: 'Language Learning',
    viDescription:
      'Sách học ngoại ngữ theo ngữ cảnh thực tế, nhanh nhớ và dễ áp dụng trong giao tiếp.',
    enDescription:
      'Language learning books with context-driven methods for practical communication fluency.',
  },
  {
    slug: 'productivity-learning',
    sortOrder: 23,
    parentSlug: 'education-skills',
    viName: 'Năng suất và phương pháp học',
    enName: 'Productivity & Learning',
    viDescription:
      'Sách về quản lý thời gian, tập trung sâu và xây dựng hệ thống học tập bền vững.',
    enDescription:
      'Books on deep focus, time management, and building sustainable long-term learning systems.',
  },
  {
    slug: 'communication',
    sortOrder: 24,
    parentSlug: 'education-skills',
    viName: 'Giao tiếp',
    enName: 'Communication',
    viDescription:
      'Sách rèn luyện kỹ năng trình bày, đàm phán, phản hồi và giao tiếp đa ngữ cảnh.',
    enDescription:
      'Communication books for presentations, negotiation, feedback culture, and collaboration.',
  },
];

async function upsertCategories(
  languageIdByCode: Map<string, number>,
  createdBy?: number,
) {
  const viLanguageId = languageIdByCode.get('vi');
  const enLanguageId = languageIdByCode.get('en');
  if (!viLanguageId || !enLanguageId)
    throw new Error('Missing vi/en language seed');

  const categoryIdBySlug = new Map<string, number>();

  for (const category of CATEGORIES) {
    const parentId = category.parentSlug
      ? (categoryIdBySlug.get(category.parentSlug) ?? null)
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
        data: {
          parentId,
          isActive: true,
          sortOrder: category.sortOrder,
          deletedAt: null,
          updatedBy: createdBy,
        },
      });
    } else {
      const created = await prisma.category.create({
        data: {
          parentId,
          isActive: true,
          sortOrder: category.sortOrder,
          createdBy,
          updatedBy: createdBy,
        },
        select: { id: true },
      });
      categoryId = created.id;
    }

    await prisma.categoryTranslation.upsert({
      where: {
        categoryId_languageId: { categoryId, languageId: viLanguageId },
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
        categoryId_languageId: { categoryId, languageId: enLanguageId },
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

// =============================================================================
// Users + Addresses
// =============================================================================

type SeedUser = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender?: string;
  avatarUrl?: string;
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

const FIXED_USERS: SeedUser[] = [
  {
    email: 'admin.nguyen@bookstore.local',
    password: 'Admin@123456',
    firstName: 'Minh',
    lastName: 'Nguyễn',
    phoneNumber: '0901000001',
    gender: 'male',
    isEmailVerified: true,
    roleCodes: [RoleCode.ADMIN],
  },
  {
    email: 'staff.lan@bookstore.local',
    password: 'Staff@123456',
    firstName: 'Lan',
    lastName: 'Trần',
    phoneNumber: '0901000002',
    gender: 'female',
    isEmailVerified: true,
    roleCodes: [RoleCode.STAFF],
  },
  {
    email: 'staff.hoang@bookstore.local',
    password: 'Staff@123456',
    firstName: 'Hoàng',
    lastName: 'Phạm',
    phoneNumber: '0901000003',
    gender: 'male',
    isEmailVerified: true,
    roleCodes: [RoleCode.STAFF],
  },
  {
    email: 'warehouse.khoa@bookstore.local',
    password: 'Warehouse@123456',
    firstName: 'Khoa',
    lastName: 'Lê',
    phoneNumber: '0901000004',
    gender: 'male',
    isEmailVerified: true,
    roleCodes: [RoleCode.WAREHOUSE],
  },
];

const CUSTOMER_NAMES = [
  ['An', 'Nguyễn'],
  ['Bình', 'Trần'],
  ['Chi', 'Lê'],
  ['Dũng', 'Phạm'],
  ['Giang', 'Hoàng'],
  ['Hạnh', 'Vũ'],
  ['Khánh', 'Đỗ'],
  ['Linh', 'Đặng'],
  ['Minh', 'Bùi'],
  ['Nam', 'Phan'],
  ['Phương', 'Ngô'],
  ['Quang', 'Dương'],
  ['Thảo', 'Lý'],
  ['Trang', 'Mai'],
  ['Vy', 'Tô'],
  ['Huy', 'Đinh'],
  ['Tuấn', 'Cao'],
  ['Nhi', 'Võ'],
  ['Tâm', 'Hồ'],
  ['Sơn', 'Đào'],
  ['My', 'Trương'],
  ['Kiên', 'Huỳnh'],
  ['Như', 'Lâm'],
  ['Long', 'Đoàn'],
  ['Yến', 'Châu'],
  ['Thiện', 'Vương'],
  ['Bảo', 'Nguyễn'],
  ['Mai', 'Trần'],
  ['Tú', 'Lê'],
  ['Ngọc', 'Phạm'],
  ['Hiếu', 'Hoàng'],
  ['Vân', 'Vũ'],
  ['Đức', 'Đỗ'],
  ['Hà', 'Đặng'],
  ['Quỳnh', 'Bùi'],
  ['Tín', 'Phan'],
];

const ADDRESS_POOL = [
  { city: 'Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé' },
  { city: 'Hồ Chí Minh', district: 'Quận 3', ward: 'Võ Thị Sáu' },
  { city: 'Hồ Chí Minh', district: 'Quận 7', ward: 'Tân Phong' },
  { city: 'Hồ Chí Minh', district: 'Thành phố Thủ Đức', ward: 'An Phú' },
  { city: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng' },
  { city: 'Hà Nội', district: 'Thanh Xuân', ward: 'Khương Trung' },
  { city: 'Đà Nẵng', district: 'Hải Châu', ward: 'Hòa Cường Bắc' },
  { city: 'Cần Thơ', district: 'Ninh Kiều', ward: 'An Hòa' },
  { city: 'Khánh Hòa', district: 'Nha Trang', ward: 'Vĩnh Hải' },
  { city: 'Bình Dương', district: 'Thủ Dầu Một', ward: 'Phú Cường' },
  { city: 'Đồng Nai', district: 'Biên Hòa', ward: 'Tân Phong' },
];

const STREET_POOL = [
  'Nguyễn Huệ',
  'Lê Lợi',
  'Trần Hưng Đạo',
  'Hai Bà Trưng',
  'Pasteur',
  'Cách Mạng Tháng 8',
  'Điện Biên Phủ',
  'Võ Văn Tần',
  'Nguyễn Trãi',
  'Phan Đình Phùng',
];

async function upsertUserWithRoles(
  user: SeedUser,
  roleIdByCode: Map<RoleCode, number>,
) {
  const password = await bcrypt.hash(user.password, 12);

  const row = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      password,
      passwordChangedAt: new Date(),
      isEmailVerified: user.isEmailVerified ?? true,
      verifyEmailAt: user.isEmailVerified === false ? null : new Date(),
      status: user.status ?? UserStatus.ACTIVE,
      deletedAt: null,
    },
    create: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      avatarUrl: user.avatarUrl,
      password,
      passwordChangedAt: new Date(),
      isEmailVerified: user.isEmailVerified ?? true,
      verifyEmailAt: user.isEmailVerified === false ? null : new Date(),
      status: user.status ?? UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
    },
  });

  await prisma.userRole.deleteMany({ where: { userId: row.id } });

  await prisma.userRole.createMany({
    data: user.roleCodes.map((roleCode) => {
      const roleId = roleIdByCode.get(roleCode);
      if (!roleId) throw new Error(`Role not found: ${roleCode}`);
      return { userId: row.id, roleId };
    }),
    skipDuplicates: true,
  });

  return row;
}

async function seedAddressesForUser(user: SeededUser) {
  await prisma.userAddress.deleteMany({ where: { userId: user.id } });

  const addressCount = randomInt(2, 4);
  const chosenLocations = takeRandomUnique(ADDRESS_POOL, addressCount);
  const fullName =
    `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim() || 'Khách hàng';

  for (let index = 0; index < chosenLocations.length; index += 1) {
    const location = chosenLocations[index];

    await prisma.userAddress.create({
      data: {
        userId: user.id,
        addressType:
          index === 0
            ? AddressType.HOME
            : randomOne([
                AddressType.HOME,
                AddressType.WORK,
                AddressType.OTHER,
              ]),
        recipientName: fullName,
        phoneNumber: user.phoneNumber ?? `09${randomInt(10000000, 99999999)}`,
        addressDetail: `Số ${randomInt(1, 350)} đường ${randomOne(STREET_POOL)}`,
        ward: location.ward,
        district: location.district,
        city: location.city,
        isDefault: index === 0,
      },
    });
  }
}

function buildCustomerSeedUsers() {
  return CUSTOMER_NAMES.slice(0, CUSTOMER_COUNT).map(
    ([firstName, lastName], index) => ({
      email: `customer${String(index + 1).padStart(2, '0')}@bookstore.local`,
      password: 'Customer@123456',
      firstName,
      lastName,
      phoneNumber: `09${String(20000000 + index).padStart(8, '0')}`,
      gender: index % 2 === 0 ? 'male' : 'female',
      isEmailVerified: true,
      roleCodes: [RoleCode.CUSTOMER],
    }),
  ) satisfies SeedUser[];
}

async function seedUsers(roleIdByCode: Map<RoleCode, number>) {
  const users: SeededUser[] = [];

  for (const user of [...FIXED_USERS, ...buildCustomerSeedUsers()]) {
    const row = await upsertUserWithRoles(user, roleIdByCode);
    users.push(row);
  }

  for (const user of users) {
    await seedAddressesForUser(user);
  }

  const admin =
    users.find((user) => user.email === 'admin.nguyen@bookstore.local') ??
    users[0];
  const staff =
    users.find((user) => user.email === 'staff.lan@bookstore.local') ?? admin;
  const warehouse =
    users.find((user) => user.email === 'warehouse.khoa@bookstore.local') ??
    admin;

  console.log(
    `Seeded users: ${users.length} (admin/staff/warehouse/customer), guest user = 0`,
  );
  return { users, admin, staff, warehouse };
}

// =============================================================================
// Books + Variants
// =============================================================================

type SeedBook = {
  title: string;
  titleVi?: string;
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

type BaseBook = Omit<SeedBook, 'isbn13'>;

const BASE_BOOKS: BaseBook[] = [
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publicationYear: 2008,
    pageCount: 464,
    categorySlugs: ['programming'],
    priceVnd: 320000,
    descriptionVi: 'Cuốn sách kinh điển về viết mã sạch, dễ đọc và dễ bảo trì.',
    descriptionEn: 'A classic guide to writing readable and maintainable code.',
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas, Andrew Hunt',
    publisher: 'Addison-Wesley',
    publicationYear: 2019,
    pageCount: 352,
    categorySlugs: ['programming'],
    priceVnd: 350000,
    descriptionVi:
      'Bộ nguyên tắc thực hành giúp lập trình viên chuyên nghiệp hơn.',
    descriptionEn:
      'Practical principles for becoming a more effective software developer.',
  },
  {
    title: 'Design Patterns',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    publisher: 'Addison-Wesley',
    publicationYear: 1994,
    pageCount: 395,
    categorySlugs: ['software-architecture', 'programming'],
    priceVnd: 380000,
    descriptionVi: 'Tác phẩm nền tảng về 23 mẫu thiết kế hướng đối tượng.',
    descriptionEn:
      'The foundational text introducing classic object-oriented design patterns.',
  },
  {
    title: 'Refactoring',
    author: 'Martin Fowler',
    publisher: 'Addison-Wesley',
    publicationYear: 2018,
    pageCount: 448,
    categorySlugs: ['programming', 'software-architecture'],
    priceVnd: 360000,
    descriptionVi:
      'Hướng dẫn cải thiện cấu trúc mã nguồn mà không đổi hành vi.',
    descriptionEn:
      'A guide to improving code structure without changing behavior.',
  },
  {
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publicationYear: 2017,
    pageCount: 432,
    categorySlugs: ['software-architecture'],
    priceVnd: 340000,
    descriptionVi:
      'Nguyên lý thiết kế kiến trúc phần mềm linh hoạt và dễ bảo trì.',
    descriptionEn:
      'Design principles for flexible and maintainable architecture.',
  },
  {
    title: 'Building Microservices',
    author: 'Sam Newman',
    publisher: "O'Reilly Media",
    publicationYear: 2021,
    pageCount: 600,
    categorySlugs: ['software-architecture', 'devops-cloud'],
    priceVnd: 420000,
    descriptionVi: 'Hướng dẫn thiết kế và vận hành hệ thống microservices.',
    descriptionEn:
      'A comprehensive guide to microservices design and operations.',
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    publisher: "O'Reilly Media",
    publicationYear: 2017,
    pageCount: 616,
    categorySlugs: ['software-architecture', 'data-ai'],
    priceVnd: 450000,
    descriptionVi:
      'Phân tích sâu về hệ thống dữ liệu phân tán và khả năng mở rộng.',
    descriptionEn: 'A deep dive into distributed data systems and scalability.',
  },
  {
    title: 'The DevOps Handbook',
    author: 'Gene Kim, Jez Humble, Patrick Debois, John Willis',
    publisher: 'IT Revolution Press',
    publicationYear: 2016,
    pageCount: 480,
    categorySlugs: ['devops-cloud'],
    priceVnd: 390000,
    descriptionVi: 'Hướng dẫn xây dựng văn hóa DevOps và cải thiện triển khai.',
    descriptionEn:
      'A practical guide to DevOps culture and delivery improvement.',
  },
  {
    title: 'Kubernetes Up and Running',
    author: 'Kelsey Hightower, Brendan Burns, Joe Beda',
    publisher: "O'Reilly Media",
    publicationYear: 2019,
    pageCount: 277,
    categorySlugs: ['devops-cloud'],
    priceVnd: 410000,
    descriptionVi:
      'Giới thiệu thực tiễn về triển khai ứng dụng trên Kubernetes.',
    descriptionEn:
      'A practical introduction to running applications on Kubernetes.',
  },
  {
    title: 'Site Reliability Engineering',
    author: 'Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Murphy',
    publisher: "O'Reilly Media",
    publicationYear: 2016,
    pageCount: 552,
    categorySlugs: ['devops-cloud', 'software-architecture'],
    priceVnd: 430000,
    descriptionVi: 'Cách vận hành hệ thống quy mô lớn với độ tin cậy cao.',
    descriptionEn: 'Practices for running large-scale reliable systems.',
  },
  {
    title: "Web Application Hacker's Handbook",
    author: 'Dafydd Stuttard, Marcus Pinto',
    publisher: 'Wiley',
    publicationYear: 2011,
    pageCount: 912,
    categorySlugs: ['cybersecurity'],
    priceVnd: 480000,
    descriptionVi: 'Cẩm nang phát hiện và khai thác lỗ hổng ứng dụng web.',
    descriptionEn:
      'A detailed guide to finding and exploiting web application flaws.',
  },
  {
    title: 'Applied Cryptography',
    author: 'Bruce Schneier',
    publisher: 'Wiley',
    publicationYear: 2015,
    pageCount: 784,
    categorySlugs: ['cybersecurity'],
    priceVnd: 460000,
    descriptionVi:
      'Tài liệu tham khảo về thuật toán và giao thức mật mã ứng dụng.',
    descriptionEn: 'A comprehensive reference on applied cryptography.',
  },
  {
    title: 'Python for Data Analysis',
    author: 'Wes McKinney',
    publisher: "O'Reilly Media",
    publicationYear: 2017,
    pageCount: 550,
    categorySlugs: ['data-ai', 'programming'],
    priceVnd: 400000,
    descriptionVi:
      'Hướng dẫn xử lý và phân tích dữ liệu bằng Python và pandas.',
    descriptionEn:
      'A guide to data wrangling and analysis with Python and pandas.',
  },
  {
    title: 'Hands-On Machine Learning',
    author: 'Aurélien Géron',
    publisher: "O'Reilly Media",
    publicationYear: 2019,
    pageCount: 819,
    categorySlugs: ['data-ai'],
    priceVnd: 470000,
    descriptionVi: 'Hướng dẫn thực hành xây dựng mô hình machine learning.',
    descriptionEn: 'A hands-on guide to building machine learning models.',
  },
  {
    title: 'Deep Learning',
    author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
    publisher: 'MIT Press',
    publicationYear: 2016,
    pageCount: 800,
    categorySlugs: ['data-ai'],
    priceVnd: 520000,
    descriptionVi: 'Giáo trình nền tảng toàn diện về deep learning.',
    descriptionEn: 'A comprehensive foundational textbook on deep learning.',
  },
  {
    title: 'Introduction to Algorithms',
    author:
      'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    publisher: 'MIT Press',
    publicationYear: 2022,
    pageCount: 1312,
    categorySlugs: ['programming', 'data-ai'],
    priceVnd: 550000,
    descriptionVi: 'Giáo trình thuật toán kinh điển trong khoa học máy tính.',
    descriptionEn: 'A classic algorithms textbook for computer science.',
  },
  {
    title: "You Don't Know JS Yet",
    author: 'Kyle Simpson',
    publisher: 'Independently Published',
    publicationYear: 2020,
    pageCount: 278,
    categorySlugs: ['programming'],
    priceVnd: 220000,
    descriptionVi: 'Khám phá các phần quan trọng và khó hiểu của JavaScript.',
    descriptionEn: 'An in-depth exploration of JavaScript language behavior.',
  },
  {
    title: 'Database Internals',
    author: 'Alex Petrov',
    publisher: "O'Reilly Media",
    publicationYear: 2019,
    pageCount: 376,
    categorySlugs: ['data-ai', 'software-architecture'],
    priceVnd: 420000,
    descriptionVi: 'Giải thích cách cơ sở dữ liệu hoạt động bên trong.',
    descriptionEn: 'An explanation of how database systems work internally.',
  },
  {
    title: 'High Performance MySQL',
    author: 'Silvia Botros, Jeremy Tinley',
    publisher: "O'Reilly Media",
    publicationYear: 2021,
    pageCount: 388,
    categorySlugs: ['data-ai', 'devops-cloud'],
    priceVnd: 420000,
    descriptionVi: 'Tối ưu MySQL cho hiệu năng và vận hành thực tế.',
    descriptionEn: 'Practical MySQL performance and operations guidance.',
  },
  {
    title: 'System Design Interview',
    author: 'Alex Xu',
    publisher: 'ByteByteGo',
    publicationYear: 2020,
    pageCount: 322,
    categorySlugs: ['software-architecture'],
    priceVnd: 320000,
    descriptionVi: 'Các bài toán thiết kế hệ thống phổ biến trong phỏng vấn.',
    descriptionEn: 'Common system design interview problems and solutions.',
  },

  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    publisher: 'Crown Business',
    publicationYear: 2011,
    pageCount: 336,
    categorySlugs: ['entrepreneurship', 'business-economics'],
    priceVnd: 250000,
    descriptionVi:
      'Phương pháp khởi nghiệp tinh gọn để kiểm chứng ý tưởng nhanh.',
    descriptionEn: 'A lean methodology for validating startup ideas quickly.',
  },
  {
    title: 'Zero to One',
    author: 'Peter Thiel, Blake Masters',
    publisher: 'Crown Business',
    publicationYear: 2014,
    pageCount: 224,
    categorySlugs: ['entrepreneurship'],
    priceVnd: 230000,
    descriptionVi: 'Quan điểm về xây dựng doanh nghiệp tạo giá trị đột phá.',
    descriptionEn:
      'A perspective on building companies that create breakthrough value.',
  },
  {
    title: 'The Hard Thing About Hard Things',
    author: 'Ben Horowitz',
    publisher: 'Harper Business',
    publicationYear: 2014,
    pageCount: 304,
    categorySlugs: ['entrepreneurship', 'management-leadership'],
    priceVnd: 260000,
    descriptionVi: 'Bài học thực tế khi xây dựng và điều hành công ty.',
    descriptionEn: 'Hard-won lessons about building and running a company.',
  },
  {
    title: 'Good to Great',
    author: 'Jim Collins',
    publisher: 'HarperBusiness',
    publicationYear: 2001,
    pageCount: 320,
    categorySlugs: ['management-leadership', 'business-economics'],
    priceVnd: 270000,
    descriptionVi: 'Nghiên cứu về cách công ty chuyển từ tốt sang vĩ đại.',
    descriptionEn:
      'A research-driven look at companies that move from good to great.',
  },
  {
    title: 'Measure What Matters',
    author: 'John Doerr',
    publisher: 'Portfolio',
    publicationYear: 2018,
    pageCount: 320,
    categorySlugs: ['management-leadership', 'business-economics'],
    priceVnd: 280000,
    descriptionVi: 'Phương pháp OKR để đặt mục tiêu và đo lường kết quả.',
    descriptionEn: 'The OKR methodology for goal-setting and execution.',
  },
  {
    title: 'Radical Candor',
    author: 'Kim Scott',
    publisher: "St. Martin's Press",
    publicationYear: 2017,
    pageCount: 320,
    categorySlugs: ['management-leadership', 'communication'],
    priceVnd: 260000,
    descriptionVi:
      'Lãnh đạo hiệu quả bằng quan tâm cá nhân và phản hồi thẳng thắn.',
    descriptionEn: 'Leadership through personal care and direct feedback.',
  },
  {
    title: 'Crossing the Chasm',
    author: 'Geoffrey A. Moore',
    publisher: 'Harper Business',
    publicationYear: 2014,
    pageCount: 254,
    categorySlugs: ['marketing-sales', 'entrepreneurship'],
    priceVnd: 260000,
    descriptionVi:
      'Chiến lược đưa sản phẩm công nghệ vào thị trường đại chúng.',
    descriptionEn:
      'A strategy for taking technology products into mainstream markets.',
  },
  {
    title: 'Influence',
    author: 'Robert B. Cialdini',
    publisher: 'Harper Business',
    publicationYear: 2006,
    pageCount: 336,
    categorySlugs: ['marketing-sales', 'psychology'],
    priceVnd: 240000,
    descriptionVi: 'Các nguyên tắc tâm lý ảnh hưởng đến quyết định con người.',
    descriptionEn: 'Psychological principles that influence human decisions.',
  },
  {
    title: 'This Is Marketing',
    author: 'Seth Godin',
    publisher: 'Portfolio',
    publicationYear: 2018,
    pageCount: 256,
    categorySlugs: ['marketing-sales'],
    priceVnd: 220000,
    descriptionVi:
      'Tiếp thị hiện đại tập trung vào giá trị thật cho khách hàng.',
    descriptionEn: 'A modern view of marketing focused on real customer value.',
  },
  {
    title: 'The Intelligent Investor',
    author: 'Benjamin Graham',
    publisher: 'Harper Business',
    publicationYear: 2006,
    pageCount: 640,
    categorySlugs: ['finance-investing'],
    priceVnd: 300000,
    descriptionVi: 'Nền tảng kinh điển của đầu tư giá trị.',
    descriptionEn: 'A classic foundation of value investing.',
  },
  {
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    publisher: 'Plata Publishing',
    publicationYear: 2017,
    pageCount: 258,
    categorySlugs: ['finance-investing'],
    priceVnd: 180000,
    descriptionVi: 'Bài học tài chính cá nhân qua câu chuyện hai người cha.',
    descriptionEn:
      'Personal finance lessons through two contrasting father figures.',
  },
  {
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    publisher: 'Harriman House',
    publicationYear: 2020,
    pageCount: 256,
    categorySlugs: ['finance-investing', 'psychology'],
    priceVnd: 210000,
    descriptionVi: 'Tâm lý và hành vi ảnh hưởng đến quyết định tài chính.',
    descriptionEn: 'How behavior and psychology shape financial decisions.',
  },
  {
    title: 'A Random Walk Down Wall Street',
    author: 'Burton G. Malkiel',
    publisher: 'W. W. Norton & Company',
    publicationYear: 2023,
    pageCount: 464,
    categorySlugs: ['finance-investing'],
    priceVnd: 290000,
    descriptionVi:
      'Phân tích chiến lược đầu tư và lý do đầu tư chỉ số hiệu quả.',
    descriptionEn: 'An analysis of investing strategies and index investing.',
  },
  {
    title: 'Principles',
    author: 'Ray Dalio',
    publisher: 'Simon & Schuster',
    publicationYear: 2017,
    pageCount: 592,
    categorySlugs: ['business-economics', 'management-leadership'],
    priceVnd: 320000,
    descriptionVi: 'Nguyên tắc sống và làm việc từ kinh nghiệm quản lý quỹ.',
    descriptionEn:
      'Life and work principles from running a large investment firm.',
  },

  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    publisher: 'Farrar, Straus and Giroux',
    publicationYear: 2013,
    pageCount: 499,
    categorySlugs: ['psychology'],
    priceVnd: 260000,
    descriptionVi: 'Khám phá hai hệ thống tư duy chi phối quyết định.',
    descriptionEn:
      'An exploration of two systems of thought that guide decisions.',
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    publisher: 'Avery',
    publicationYear: 2018,
    pageCount: 320,
    categorySlugs: ['psychology', 'productivity-learning'],
    priceVnd: 220000,
    descriptionVi: 'Phương pháp xây dựng thói quen tốt bền vững.',
    descriptionEn: 'A method for building good habits and breaking bad ones.',
  },
  {
    title: 'Mindset',
    author: 'Carol S. Dweck',
    publisher: 'Ballantine Books',
    publicationYear: 2007,
    pageCount: 320,
    categorySlugs: ['psychology'],
    priceVnd: 210000,
    descriptionVi: 'Phân biệt tư duy cố định và tư duy phát triển.',
    descriptionEn: 'The difference between fixed and growth mindsets.',
  },
  {
    title: 'The Body Keeps the Score',
    author: 'Bessel van der Kolk',
    publisher: 'Viking',
    publicationYear: 2014,
    pageCount: 464,
    categorySlugs: ['psychology'],
    priceVnd: 280000,
    descriptionVi: 'Nghiên cứu tác động của sang chấn lên cơ thể và tâm trí.',
    descriptionEn: 'A study of trauma and its impact on body and mind.',
  },
  {
    title: "Man's Search for Meaning",
    author: 'Viktor E. Frankl',
    publisher: 'Beacon Press',
    publicationYear: 2006,
    pageCount: 184,
    categorySlugs: ['psychology', 'philosophy'],
    priceVnd: 150000,
    descriptionVi: 'Hồi ký và triết lý sống về ý nghĩa.',
    descriptionEn: 'A memoir and philosophy about meaning.',
  },
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    publisher: 'Harper',
    publicationYear: 2015,
    pageCount: 464,
    categorySlugs: ['history', 'mind-society'],
    priceVnd: 270000,
    descriptionVi: 'Lịch sử loài người từ săn bắt hái lượm đến hiện đại.',
    descriptionEn: 'A sweeping history of humankind.',
  },
  {
    title: 'Guns, Germs, and Steel',
    author: 'Jared Diamond',
    publisher: 'W. W. Norton & Company',
    publicationYear: 1999,
    pageCount: 480,
    categorySlugs: ['history'],
    priceVnd: 260000,
    descriptionVi: 'Giải thích vì sao các nền văn minh phát triển khác nhau.',
    descriptionEn: 'An explanation of why civilizations developed differently.',
  },
  {
    title: 'Meditations',
    author: 'Marcus Aurelius',
    publisher: 'Modern Library',
    publicationYear: 2003,
    pageCount: 304,
    categorySlugs: ['philosophy'],
    priceVnd: 160000,
    descriptionVi: 'Suy ngẫm khắc kỷ về cách sống đức hạnh.',
    descriptionEn: 'Stoic reflections on living a virtuous life.',
  },
  {
    title: 'The Republic',
    author: 'Plato',
    publisher: 'Penguin Classics',
    publicationYear: 2007,
    pageCount: 416,
    categorySlugs: ['philosophy'],
    priceVnd: 170000,
    descriptionVi: 'Đối thoại triết học về công lý và nhà nước lý tưởng.',
    descriptionEn: 'A classic dialogue about justice and the ideal state.',
  },
  {
    title: 'The Art of War',
    author: 'Sun Tzu',
    publisher: 'Shambhala',
    publicationYear: 2005,
    pageCount: 273,
    categorySlugs: ['philosophy', 'management-leadership'],
    priceVnd: 150000,
    descriptionVi: 'Binh pháp cổ được ứng dụng trong lãnh đạo và kinh doanh.',
    descriptionEn:
      'An ancient strategy text applied to leadership and business.',
  },
  {
    title: 'Weapons of Math Destruction',
    author: "Cathy O'Neil",
    publisher: 'Crown',
    publicationYear: 2016,
    pageCount: 272,
    categorySlugs: ['social-issues', 'data-ai'],
    priceVnd: 230000,
    descriptionVi: 'Cảnh báo về thuật toán dữ liệu lớn và bất công xã hội.',
    descriptionEn: 'A warning on how data algorithms can amplify inequality.',
  },

  {
    title: '1984',
    author: 'George Orwell',
    publisher: 'Signet Classics',
    publicationYear: 1961,
    pageCount: 328,
    categorySlugs: ['fiction'],
    priceVnd: 150000,
    descriptionVi: 'Tiểu thuyết phản địa đàng về giám sát và kiểm soát.',
    descriptionEn: 'A dystopian novel about surveillance and control.',
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    publisher: 'Harper Perennial',
    publicationYear: 2002,
    pageCount: 336,
    categorySlugs: ['fiction'],
    priceVnd: 160000,
    descriptionVi: 'Câu chuyện về công lý và phân biệt chủng tộc.',
    descriptionEn: 'A story about justice and racial inequality.',
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    publisher: 'Scribner',
    publicationYear: 2004,
    pageCount: 180,
    categorySlugs: ['fiction'],
    priceVnd: 130000,
    descriptionVi: 'Bi kịch về giấc mơ Mỹ thời Jazz Age.',
    descriptionEn: 'A tragic portrait of the American Dream.',
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    publisher: 'Penguin Classics',
    publicationYear: 2003,
    pageCount: 480,
    categorySlugs: ['fiction'],
    priceVnd: 140000,
    descriptionVi: 'Tiểu thuyết kinh điển về định kiến và hôn nhân.',
    descriptionEn: 'A classic romantic novel about prejudice and marriage.',
  },
  {
    title: 'One Hundred Years of Solitude',
    author: 'Gabriel García Márquez',
    publisher: 'Harper Perennial',
    publicationYear: 2006,
    pageCount: 417,
    categorySlugs: ['fiction'],
    priceVnd: 180000,
    descriptionVi: 'Hiện thực huyền ảo về nhiều thế hệ gia đình Buendía.',
    descriptionEn: 'A magical realist saga of the Buendía family.',
  },
  {
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    publisher: 'Vintage Classics',
    publicationYear: 1993,
    pageCount: 560,
    categorySlugs: ['fiction'],
    priceVnd: 190000,
    descriptionVi: 'Hành trình tâm lý của một sinh viên sau tội ác.',
    descriptionEn: 'A psychologically intense journey after a crime.',
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: 'J. K. Rowling',
    publisher: 'Scholastic',
    publicationYear: 1998,
    pageCount: 309,
    categorySlugs: ['children-ya', 'fiction'],
    priceVnd: 170000,
    descriptionVi: 'Khởi đầu hành trình phép thuật tại Hogwarts.',
    descriptionEn: 'The beginning of a magical journey at Hogwarts.',
  },
  {
    title: 'The Hobbit',
    author: 'J. R. R. Tolkien',
    publisher: 'Houghton Mifflin Harcourt',
    publicationYear: 2012,
    pageCount: 300,
    categorySlugs: ['children-ya', 'fiction'],
    priceVnd: 170000,
    descriptionVi: 'Cuộc phiêu lưu của Bilbo Baggins cùng các chú lùn.',
    descriptionEn: "Bilbo Baggins' adventure with dwarves.",
  },
  {
    title: 'The Little Prince',
    author: 'Antoine de Saint-Exupéry',
    publisher: 'Harcourt',
    publicationYear: 2000,
    pageCount: 96,
    categorySlugs: ['children-ya', 'fiction'],
    priceVnd: 100000,
    descriptionVi: 'Ngụ ngôn triết lý về tình yêu và bản chất con người.',
    descriptionEn: 'A philosophical fable about love and human nature.',
  },
  {
    title: 'Norwegian Wood',
    author: 'Haruki Murakami',
    publisher: 'Vintage International',
    publicationYear: 2000,
    pageCount: 296,
    categorySlugs: ['fiction', 'literature-arts'],
    priceVnd: 160000,
    descriptionVi: 'Câu chuyện tình yêu và mất mát của sinh viên Nhật Bản.',
    descriptionEn: 'A poetic story of love and loss.',
  },
  {
    title: 'Animal Farm',
    author: 'George Orwell',
    publisher: 'Signet Classics',
    publicationYear: 1996,
    pageCount: 141,
    categorySlugs: ['fiction', 'social-issues'],
    priceVnd: 110000,
    descriptionVi: 'Ngụ ngôn chính trị về quyền lực và tha hóa.',
    descriptionEn: 'A political fable about power and corruption.',
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    publisher: 'HarperOne',
    publicationYear: 2014,
    pageCount: 208,
    categorySlugs: ['fiction', 'philosophy'],
    priceVnd: 150000,
    descriptionVi: 'Hành trình theo đuổi vận mệnh và lắng nghe trái tim.',
    descriptionEn: 'A journey of destiny and listening to the heart.',
  },

  {
    title: 'Make It Stick',
    author: 'Peter C. Brown, Henry L. Roediger III, Mark A. McDaniel',
    publisher: 'Belknap Press',
    publicationYear: 2014,
    pageCount: 336,
    categorySlugs: ['productivity-learning', 'education-skills'],
    priceVnd: 250000,
    descriptionVi: 'Nghiên cứu về phương pháp học hiệu quả và ghi nhớ lâu.',
    descriptionEn: 'Research-backed effective learning strategies.',
  },
  {
    title: 'Deep Work',
    author: 'Cal Newport',
    publisher: 'Grand Central Publishing',
    publicationYear: 2016,
    pageCount: 304,
    categorySlugs: ['productivity-learning'],
    priceVnd: 230000,
    descriptionVi:
      'Phương pháp làm việc tập trung sâu trong thời đại phân tán.',
    descriptionEn: 'A method for focused work in a distracted world.',
  },
  {
    title: 'Getting Things Done',
    author: 'David Allen',
    publisher: 'Penguin Books',
    publicationYear: 2015,
    pageCount: 352,
    categorySlugs: ['productivity-learning'],
    priceVnd: 240000,
    descriptionVi: 'Hệ thống quản lý công việc và thời gian.',
    descriptionEn: 'A system for managing work and time.',
  },
  {
    title: 'How to Win Friends and Influence People',
    author: 'Dale Carnegie',
    publisher: 'Simon & Schuster',
    publicationYear: 1998,
    pageCount: 291,
    categorySlugs: ['communication', 'psychology'],
    priceVnd: 200000,
    descriptionVi: 'Nguyên tắc giao tiếp kinh điển để xây dựng quan hệ.',
    descriptionEn: 'Classic communication principles for relationships.',
  },
  {
    title: 'Crucial Conversations',
    author: 'Kerry Patterson, Joseph Grenny, Ron McMillan, Al Switzler',
    publisher: 'McGraw-Hill',
    publicationYear: 2011,
    pageCount: 256,
    categorySlugs: ['communication', 'management-leadership'],
    priceVnd: 250000,
    descriptionVi: 'Kỹ năng xử lý các cuộc trò chuyện khó.',
    descriptionEn: 'Skills for handling high-stakes conversations.',
  },
  {
    title: 'Never Split the Difference',
    author: 'Chris Voss, Tahl Raz',
    publisher: 'Harper Business',
    publicationYear: 2016,
    pageCount: 288,
    categorySlugs: ['communication', 'business-economics'],
    priceVnd: 240000,
    descriptionVi: 'Kỹ thuật đàm phán từ chuyên gia FBI.',
    descriptionEn: 'Negotiation tactics from a former FBI negotiator.',
  },
  {
    title: 'English Grammar in Use',
    author: 'Raymond Murphy',
    publisher: 'Cambridge University Press',
    publicationYear: 2019,
    pageCount: 380,
    categorySlugs: ['language-learning'],
    priceVnd: 280000,
    descriptionVi: 'Sách ngữ pháp tiếng Anh tự học phổ biến.',
    descriptionEn: 'A popular self-study English grammar book.',
  },
  {
    title: '504 Absolutely Essential Words',
    author: 'Murray Bromberg, Melvin Gordon',
    publisher: "Barron's Educational Series",
    publicationYear: 2013,
    pageCount: 442,
    categorySlugs: ['language-learning'],
    priceVnd: 200000,
    descriptionVi: 'Bộ từ vựng tiếng Anh thiết yếu theo chủ đề.',
    descriptionEn: 'Essential English vocabulary organized by theme.',
  },
  {
    title: 'Fluent Forever',
    author: 'Gabriel Wyner',
    publisher: 'Harmony',
    publicationYear: 2014,
    pageCount: 336,
    categorySlugs: ['language-learning'],
    priceVnd: 230000,
    descriptionVi: 'Phương pháp học ngoại ngữ dựa trên trí nhớ và ngữ âm.',
    descriptionEn: 'A language learning method based on memory science.',
  },
];

function buildBooks() {
  const books: SeedBook[] = [];

  for (let index = 0; index < BOOK_COUNT; index += 1) {
    const base = BASE_BOOKS[index % BASE_BOOKS.length];
    const round = Math.floor(index / BASE_BOOKS.length);
    const isbn13 = isbn13FromSeed(100000000 + index + 1);

    books.push({
      ...base,
      title:
        round === 0
          ? base.title
          : `${base.title} - Special Edition ${round + 1}`,
      titleVi:
        round === 0
          ? base.titleVi
          : `${base.titleVi ?? base.title} - Bản đặc biệt ${round + 1}`,
      isbn13,
      publicationYear: Math.min(
        2026,
        Math.max(1950, base.publicationYear + (round % 3)),
      ),
      pageCount: base.pageCount + round * 8,
      priceVnd: toRoundedVnd(base.priceVnd * (1 + round * 0.04)),
    });
  }

  return books;
}

function coverImageUrlForBook(index: number, isbn13: string) {
  return `https://picsum.photos/seed/book-${index}-${isbn13}/720/1080`;
}

async function upsertAuthorByName(defaultName: string) {
  const existing = await prisma.author.findFirst({
    where: { defaultName },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.author.create({
    data: { defaultName },
    select: { id: true },
  });
  return created.id;
}

async function upsertPublisherByName(defaultName: string) {
  const existing = await prisma.publisher.findFirst({
    where: { defaultName },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.publisher.create({
    data: { defaultName },
    select: { id: true },
  });
  return created.id;
}

function splitAuthors(authorText: string) {
  return authorText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatsForBook(bookIndex: number) {
  // Sách inactive dùng để test trạng thái draft/ngừng bán:
  // chỉ có record Book, không có BookVariant nào.
  if (!isBookActive(bookIndex)) return [];

  if (bookIndex % 11 === 0) return [BookFormat.PAPERBACK];
  if (bookIndex % 7 === 0) return [BookFormat.HARDCOVER, BookFormat.AUDIOBOOK];
  if (bookIndex % 5 === 0)
    return [BookFormat.PAPERBACK, BookFormat.HARDCOVER, BookFormat.EBOOK];
  if (bookIndex % 4 === 0) return [BookFormat.PAPERBACK, BookFormat.EBOOK];
  if (bookIndex % 3 === 0) return [BookFormat.PAPERBACK, BookFormat.HARDCOVER];
  return [BookFormat.PAPERBACK];
}

function badgeForBook(bookIndex: number) {
  const mod = bookIndex % 10;
  if (mod === 0) return Badge.BESTSELLER;
  if (mod === 1) return Badge.NEW;
  if (mod === 2) return Badge.LIMITED;
  if (mod === 3) return Badge.EDITION;
  return null;
}

function isBookActive(bookIndex: number) {
  // Một số đầu sách vẫn ở trạng thái nháp/ngừng để test admin/catalog.
  return bookIndex % 13 !== 0;
}

function priceForFormat(basePrice: number, format: BookFormat) {
  const multiplier =
    format === BookFormat.HARDCOVER
      ? 1.35
      : format === BookFormat.EBOOK
        ? 0.65
        : format === BookFormat.AUDIOBOOK
          ? 1.1
          : 1;
  return toRoundedVnd(basePrice * multiplier);
}

// =============================================================================
// Kế hoạch nghiệp vụ cho từng variant (mô phỏng vòng đời thật):
//
//  DRAFT                        : chỉ mới tạo, chưa có PO nào.
//  PO_PENDING                   : đã tạo đơn mua, CHƯA duyệt.
//  PO_APPROVED_WAITING_PROCESS  : đã duyệt, kho CHƯA bắt đầu xử lý nhập.
//  PROCESSING_IMPORT            : kho đang xử lý nhập (statusTransfer = PROCESSING),
//                                 chưa có StockImport hoàn tất.
//  IMPORTED_WAITING_PRICE       : đã nhập kho xong (có tồn kho thật) nhưng admin
//                                 CHƯA chốt giá bán -> isActive vẫn false.
//  SELLABLE_SINGLE_BATCH        : đã nhập 1 đợt và admin đã chốt giá bán.
//  SELLABLE_MULTI_BATCH         : đã nhập NHIỀU đợt (nhiều PO khác nhà cung cấp/
//                                 chiết khấu khác nhau); admin chốt giá bán sau
//                                 khi hàng đã nhập kho.
//  DIGITAL_DRAFT                : variant số vừa tạo, admin chưa set giá.
//  DIGITAL_SELLABLE              : variant số, admin đã set giá bán trực tiếp
//                                 (không cần PO vì không có tồn kho vật lý).
// =============================================================================
type ProcurementPlan =
  | 'DRAFT'
  | 'PO_PENDING'
  | 'PO_APPROVED_WAITING_PROCESS'
  | 'PROCESSING_IMPORT'
  | 'IMPORTED_WAITING_PRICE'
  | 'SELLABLE_SINGLE_BATCH'
  | 'SELLABLE_MULTI_BATCH'
  | 'DIGITAL_DRAFT'
  | 'DIGITAL_SELLABLE';

function planForVariant(
  bookIndex: number,
  variantIndex: number,
  format: BookFormat,
): ProcurementPlan {
  const isDigital =
    format === BookFormat.EBOOK || format === BookFormat.AUDIOBOOK;

  if (isDigital) {
    return bookIndex % 6 === 0 ? 'DIGITAL_DRAFT' : 'DIGITAL_SELLABLE';
  }

  if (!isBookActive(bookIndex)) return 'DRAFT';

  const mod = (bookIndex + variantIndex) % 12;
  if (mod === 0) return 'DRAFT';
  if (mod === 1 || mod === 2) return 'PO_PENDING';
  if (mod === 3) return 'PO_APPROVED_WAITING_PROCESS';
  if (mod === 4) return 'PROCESSING_IMPORT';
  if (mod === 5 || mod === 6) return 'IMPORTED_WAITING_PRICE';
  if (mod === 7) return 'SELLABLE_MULTI_BATCH';
  return 'SELLABLE_SINGLE_BATCH';
}

type SeededBookVariant = {
  id: number;
  bookId: number;
  format: BookFormat;
  isbn: string;
  isDigital: boolean;
  plannedSellPrice: number;
  plan: ProcurementPlan;
};

async function removeSeedVariantsForBook(bookId: number) {
  const variants = await prisma.bookVariant.findMany({
    where: { bookId },
    select: { id: true },
  });

  const variantIds = variants.map((variant) => variant.id);
  if (variantIds.length === 0) return;

  const seedPurchaseOrderItems = await prisma.purchaseOrderItem.findMany({
    where: {
      bookVariantId: { in: variantIds },
      purchaseOrder: {
        code: { startsWith: 'SEED-PO-' },
      },
    },
    select: {
      id: true,
      purchaseOrderId: true,
    },
  });

  const seedPurchaseOrderItemIds = seedPurchaseOrderItems.map(
    (item) => item.id,
  );
  const seedPurchaseOrderIds = [
    ...new Set(seedPurchaseOrderItems.map((item) => item.purchaseOrderId)),
  ];

  if (seedPurchaseOrderItemIds.length > 0) {
    await prisma.stockImportItem.deleteMany({
      where: { purchaseOrderItemId: { in: seedPurchaseOrderItemIds } },
    });
  }

  if (seedPurchaseOrderIds.length > 0) {
    await prisma.stockImport.deleteMany({
      where: { purchaseOrderId: { in: seedPurchaseOrderIds } },
    });

    await prisma.purchaseOrderItem.deleteMany({
      where: { id: { in: seedPurchaseOrderItemIds } },
    });

    await prisma.purchaseOrder.deleteMany({
      where: { id: { in: seedPurchaseOrderIds } },
    });
  }

  await prisma.bookVariantSnapshot.deleteMany({
    where: { bookVariantId: { in: variantIds } },
  });

  await prisma.bookVariant.deleteMany({
    where: { id: { in: variantIds } },
  });
}

async function upsertCatalogBooks(
  languageIdByCode: Map<string, number>,
  categoryIdBySlug: Map<string, number>,
  createdBy?: number,
) {
  const viLanguageId = languageIdByCode.get('vi');
  const enLanguageId = languageIdByCode.get('en');
  if (!viLanguageId || !enLanguageId)
    throw new Error('Missing vi/en language seed');

  const seededVariants: SeededBookVariant[] = [];
  const seededBookIds: number[] = [];
  const books = buildBooks();

  for (let index = 0; index < books.length; index += 1) {
    const book = books[index];
    const formats = formatsForBook(index);
    // Rule seed: book có ít nhất 1 format thì mới active và mới có variant.
    // Book không có format sẽ chỉ tồn tại ở bảng books, không có variants.
    const active = formats.length > 0;
    const slug = `${slugify(book.title)}-${book.isbn13.slice(-6)}`;
    const coverImageUrl = coverImageUrlForBook(index, book.isbn13);
    const galleryImageUrl = coverImageUrlForBook(index + 37, book.isbn13);
    const publisherId = await upsertPublisherByName(book.publisher);
    const weightGrams = Math.max(120, 180 + Math.round(book.pageCount * 1.4));

    const existingTranslation = await prisma.bookTranslation.findFirst({
      where: { languageId: enLanguageId, slug },
      select: { bookId: true },
    });

    let bookId: number;
    if (existingTranslation) {
      bookId = existingTranslation.bookId;
      await prisma.book.update({
        where: { id: bookId },
        data: {
          publisherId,
          publicationYear: book.publicationYear,
          weightGrams,
          pageCount: book.pageCount,
          coverImageUrl,
          // isActive của Book phản ánh việc sản phẩm còn kinh doanh hay không
          // ở cấp đầu sách; việc BÁN ĐƯỢC hay không thực sự nằm ở BookVariant.isActive.
          isActive: active,
          deletedAt: null,
          updatedBy: createdBy,
        },
      });
    } else {
      const created = await prisma.book.create({
        data: {
          publisherId,
          publicationYear: book.publicationYear,
          weightGrams,
          pageCount: book.pageCount,
          coverImageUrl,
          isActive: active,
          createdBy,
          updatedBy: createdBy,
        },
        select: { id: true },
      });
      bookId = created.id;
    }

    seededBookIds.push(bookId);

    await prisma.bookTranslation.upsert({
      where: { bookId_languageId: { bookId, languageId: enLanguageId } },
      update: {
        title: book.title,
        description: book.descriptionEn,
        slug,
      },
      create: {
        bookId,
        languageId: enLanguageId,
        title: book.title,
        description: book.descriptionEn,
        slug,
      },
    });

    await prisma.bookTranslation.upsert({
      where: { bookId_languageId: { bookId, languageId: viLanguageId } },
      update: {
        title: book.titleVi ?? book.title,
        description: book.descriptionVi,
        slug,
      },
      create: {
        bookId,
        languageId: viLanguageId,
        title: book.titleVi ?? book.title,
        description: book.descriptionVi,
        slug,
      },
    });

    await prisma.bookAuthor.deleteMany({ where: { bookId } });
    const authors = splitAuthors(book.author);
    for (let authorIndex = 0; authorIndex < authors.length; authorIndex += 1) {
      const authorId = await upsertAuthorByName(authors[authorIndex]);
      await prisma.bookAuthor.upsert({
        where: { bookId_authorId: { bookId, authorId } },
        update: { isPrimary: authorIndex === 0 },
        create: {
          bookId,
          authorId,
          isPrimary: authorIndex === 0,
        },
      });
    }

    await prisma.bookCategory.deleteMany({ where: { bookId } });
    const categoryIds = book.categorySlugs
      .map((categorySlug) => categoryIdBySlug.get(categorySlug))
      .filter((id): id is number => Boolean(id));

    if (categoryIds.length) {
      await prisma.bookCategory.createMany({
        data: categoryIds.map((categoryId) => ({ bookId, categoryId })),
        skipDuplicates: true,
      });
    }

    await prisma.bookSpec.upsert({
      where: { bookId },
      update: {
        widthCm: 14,
        heightCm: 20.5,
        thicknessCm: Math.max(
          0.6,
          Math.round((book.pageCount / 360) * 100) / 100,
        ),
        packaging: active ? 'Bọc màng co tiêu chuẩn' : 'Ngừng kinh doanh',
      },
      create: {
        bookId,
        widthCm: 14,
        heightCm: 20.5,
        thicknessCm: Math.max(
          0.6,
          Math.round((book.pageCount / 360) * 100) / 100,
        ),
        packaging: active ? 'Bọc màng co tiêu chuẩn' : 'Ngừng kinh doanh',
      },
    });

    const badge = active ? badgeForBook(index) : null;
    if (badge) {
      await prisma.bookBadge.upsert({
        where: { bookId },
        update: { code: badge },
        create: { bookId, code: badge },
      });
    } else {
      await prisma.bookBadge.deleteMany({ where: { bookId } });
    }

    if (formats.length === 0) {
      await prisma.bookVariantAsset.deleteMany({ where: { bookId } });
      await removeSeedVariantsForBook(bookId);
      continue;
    }

    await prisma.bookVariantAsset.deleteMany({ where: { bookId } });
    await prisma.bookVariantAsset.createMany({
      data: [
        { bookId, url: coverImageUrl, assetType: 'COVER', sortOrder: 0 },
        { bookId, url: galleryImageUrl, assetType: 'GALLERY', sortOrder: 1 },
      ],
    });

    for (
      let variantIndex = 0;
      variantIndex < formats.length;
      variantIndex += 1
    ) {
      const format = formats[variantIndex];
      const isDigital =
        format === BookFormat.EBOOK || format === BookFormat.AUDIOBOOK;
      const plannedSellPrice = priceForFormat(book.priceVnd, format);
      const isbn = makeVariantIsbn(book, index, variantIndex);
      const plan = planForVariant(index, variantIndex, format);

      // ĐÚNG NGHIỆP VỤ: admin tạo variant LUÔN ở trạng thái nháp -
      // chưa giá, chưa tồn kho, isActive = false. Việc set giá/tồn kho
      // được xử lý riêng ở bước procurement (đơn mua -> duyệt -> nhập kho
      // -> chốt giá) hoặc set giá trực tiếp cho variant số.
      const variant = await prisma.bookVariant.upsert({
        where: { bookId_format_edition: { bookId, format, edition: 1 } },
        update: {
          isbn,
          price: null,
          currencyCode: CURRENCY_CODE_VND,
          stock: 0,
          available: 0,
          reserved: 0,
          isActive: false,
          supplierId: null,
          publicationYear: book.publicationYear,
        },
        create: {
          bookId,
          format,
          edition: 1,
          isbn,
          price: null,
          currencyCode: CURRENCY_CODE_VND,
          stock: 0,
          available: 0,
          reserved: 0,
          isActive: false,
          supplierId: null,
          publicationYear: book.publicationYear,
        },
        select: {
          id: true,
          bookId: true,
          format: true,
          isbn: true,
        },
      });

      seededVariants.push({
        id: variant.id,
        bookId: variant.bookId,
        format: variant.format,
        isbn: variant.isbn,
        isDigital,
        plannedSellPrice,
        plan,
      });
    }
  }

  return {
    bookIds: seededBookIds,
    variants: seededVariants,
  };
}

// =============================================================================
// Procurement Flow: PurchaseOrder (PENDING) -> Approve (APPROVED) ->
// Processing (statusTransfer PROCESSING) -> StockImport (statusTransfer PURCHASE,
// cộng dồn tồn kho) -> Admin chốt giá bán bằng BookVariant.price.
// =============================================================================

type ImportedBatch = {
  purchaseOrderItemId: string;
  netUnitPrice: number;
  realQuantity: number;
};

async function runDigitalActivation(variant: SeededBookVariant) {
  // Variant số không cần nhập kho vật lý: admin set giá bán trực tiếp.
  await prisma.bookVariant.update({
    where: { id: variant.id },
    data: {
      price: variant.plannedSellPrice,
      currencyCode: CURRENCY_CODE_VND,
      stock: 9999,
      available: 9999,
      reserved: 0,
      isActive: true,
    },
  });
}

async function runPhysicalProcurement(
  variant: SeededBookVariant,
  supplierIds: number[],
  staffUserId: number,
  adminUserId: number,
  warehouseUserId: number,
  counters: {
    purchaseOrderCount: number;
    approvedCount: number;
    processingCount: number;
    stockImportCount: number;
    importedWaitingPriceCount: number;
    sellableCount: number;
  },
) {
  const plan = variant.plan;
  const batchCount = plan === 'SELLABLE_MULTI_BATCH' ? 2 : 1;
  const importedBatches: ImportedBatch[] = [];
  let totalRealQuantity = 0;
  let lastSupplierId = supplierIds[variant.id % supplierIds.length];

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
    const supplierId =
      supplierIds[(variant.id + batchIndex * 5) % supplierIds.length];
    lastSupplierId = supplierId;
    const quantity = physicalStockForBook(variant.id + batchIndex * 7);

    // unitPrice: giá niêm yết nhà cung cấp báo cho đợt nhập này.
    const unitPrice = variant.plannedSellPrice;
    // discountPrice: % chiết khấu, lưu dạng SỐ NGUYÊN (vd 30 = 30%), khác
    // nhau theo từng đợt nhập để mô phỏng nhiều nhà cung cấp/thời điểm khác nhau.
    const discountPercent = discountPercentForBatch(
      variant.id + batchIndex * 3,
    );
    // price: giá nhập THỰC (net) sau chiết khấu.
    const netUnitPrice = toRoundedVnd(unitPrice * (1 - discountPercent / 100));
    const totalPrice = toMoney(netUnitPrice * quantity);

    const code = `SEED-PO-${String(variant.id).padStart(6, '0')}-${batchIndex + 1}`;

    const purchaseOrder = await prisma.purchaseOrder.upsert({
      where: { code },
      update: {
        supplierId,
        createdById: staffUserId,
        approvedById: null,
        status: PurchaseOrderStatus.PENDING,
        statusTransfer: PurchaseOrderType.PENDING,
        note: `Đơn mua nhập hàng cho variant #${variant.id} (đợt ${batchIndex + 1}/${batchCount})`,
        totalAmount: totalPrice,
        realPayPrice: null,
        taxAmount: 0,
        approvedAt: null,
        updateTransferId: null,
      },
      create: {
        code,
        supplierId,
        createdById: staffUserId,
        status: PurchaseOrderStatus.PENDING,
        statusTransfer: PurchaseOrderType.PENDING,
        note: `Đơn mua nhập hàng cho variant #${variant.id} (đợt ${batchIndex + 1}/${batchCount})`,
        totalAmount: totalPrice,
        taxAmount: 0,
      },
      select: { id: true },
    });

    // Idempotent: xoá item cũ trước khi tạo lại (tránh nhân đôi khi seed lại).
    await prisma.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: purchaseOrder.id },
    });

    const purchaseOrderItem = await prisma.purchaseOrderItem.create({
      data: {
        purchaseOrderId: purchaseOrder.id,
        bookVariantId: variant.id,
        quantity,
        unitPrice,
        price: netUnitPrice,
        discountPrice: discountPercent,
        totalPrice,
      },
      select: { id: true },
    });

    counters.purchaseOrderCount += 1;

    // Dừng lại nếu kế hoạch chỉ yêu cầu tạo đơn (chưa duyệt).
    if (plan === 'PO_PENDING' && batchIndex === batchCount - 1) {
      continue;
    }

    // Admin duyệt đơn mua.
    await prisma.purchaseOrder.update({
      where: { id: purchaseOrder.id },
      data: {
        status: PurchaseOrderStatus.APPROVED,
        approvedById: adminUserId,
        approvedAt: new Date(),
        statusTransfer: PurchaseOrderType.PENDING,
        updateTransferId: adminUserId,
      },
    });
    counters.approvedCount += 1;

    if (
      plan === 'PO_APPROVED_WAITING_PROCESS' &&
      batchIndex === batchCount - 1
    ) {
      continue;
    }

    // Kho bắt đầu xử lý nhập hàng.
    await prisma.purchaseOrder.update({
      where: { id: purchaseOrder.id },
      data: {
        statusTransfer: PurchaseOrderType.PROCESSING,
        updateTransferId: warehouseUserId,
      },
    });
    counters.processingCount += 1;

    if (plan === 'PROCESSING_IMPORT' && batchIndex === batchCount - 1) {
      continue;
    }

    // Hoàn tất nhập kho: ghi nhận số lượng thực nhận, có thể thiếu hụt.
    const isShort = (variant.id + batchIndex) % 9 === 0;
    const lackQuantity = isShort ? Math.max(1, Math.round(quantity * 0.05)) : 0;
    const realQuantity = Math.max(0, quantity - lackQuantity);
    const realTotalPrice = toMoney(netUnitPrice * realQuantity);

    // Idempotent: xoá StockImport cũ (nếu seed lại) trước khi tạo mới.
    const existingStockImport = await prisma.stockImport.findUnique({
      where: { purchaseOrderId: purchaseOrder.id },
      select: { id: true },
    });
    if (existingStockImport) {
      await prisma.stockImport.delete({
        where: { id: existingStockImport.id },
      });
    }

    await prisma.stockImport.create({
      data: {
        purchaseOrderId: purchaseOrder.id,
        createdBy: warehouseUserId,
        note:
          lackQuantity > 0
            ? `Nhận thiếu ${lackQuantity} cuốn so với đơn mua (đặt ${quantity}, nhận ${realQuantity}). Đã ghi nhận thiếu hàng với nhà cung cấp.`
            : `Nhận đủ ${realQuantity} cuốn theo đúng số lượng đơn mua.`,
        totalAmount: realTotalPrice,
        items: {
          create: {
            purchaseOrderItemId: purchaseOrderItem.id,
            realQuantity,
            lackQuantity,
            totalPrice: realTotalPrice,
          },
        },
      },
    });
    counters.stockImportCount += 1;

    await prisma.purchaseOrder.update({
      where: { id: purchaseOrder.id },
      data: {
        statusTransfer: PurchaseOrderType.PURCHASE,
        realPayPrice: realTotalPrice,
        updateTransferId: warehouseUserId,
      },
    });

    totalRealQuantity += realQuantity;
    importedBatches.push({
      purchaseOrderItemId: purchaseOrderItem.id,
      netUnitPrice,
      realQuantity,
    });
  }

  // Chưa có đợt nào nhập kho xong -> variant vẫn ở trạng thái nháp/không bán được.
  if (importedBatches.length === 0) {
    await prisma.bookVariant.update({
      where: { id: variant.id },
      data: {
        supplierId: lastSupplierId,
        price: null,
        stock: 0,
        reserved: 0,
        available: 0,
        isActive: false,
      },
    });
    return;
  }

  // Đã nhập kho xong ít nhất 1 đợt nhưng admin chưa chốt giá bán:
  // có tồn kho thật, nhưng price vẫn null và variant chưa bán được.
  if (plan === 'IMPORTED_WAITING_PRICE') {
    await prisma.bookVariant.update({
      where: { id: variant.id },
      data: {
        supplierId: lastSupplierId,
        price: null,
        stock: totalRealQuantity,
        reserved: 0,
        available: totalRealQuantity,
        isActive: false,
      },
    });
    counters.importedWaitingPriceCount += 1;
    return;
  }

  // SELLABLE_SINGLE_BATCH / SELLABLE_MULTI_BATCH: admin chốt giá bán.
  await prisma.bookVariant.update({
    where: { id: variant.id },
    data: {
      supplierId: lastSupplierId,
      price: variant.plannedSellPrice,
      stock: totalRealQuantity,
      reserved: 0,
      available: totalRealQuantity,
      isActive: true,
    },
  });
  counters.sellableCount += 1;
}

async function seedProcurementForVariants(
  variants: SeededBookVariant[],
  supplierIdByCode: Map<string, number>,
  staffUserId: number,
  adminUserId: number,
  warehouseUserId: number,
) {
  const supplierIds = [...supplierIdByCode.values()];
  if (!supplierIds.length) throw new Error('Missing supplier seed');

  const counters = {
    purchaseOrderCount: 0,
    approvedCount: 0,
    processingCount: 0,
    stockImportCount: 0,
    importedWaitingPriceCount: 0,
    sellableCount: 0,
  };
  let digitalActivatedCount = 0;
  let draftCount = 0;

  for (const variant of variants) {
    if (variant.plan === 'DRAFT' || variant.plan === 'DIGITAL_DRAFT') {
      draftCount += 1;
      continue;
    }

    if (variant.plan === 'DIGITAL_SELLABLE') {
      await runDigitalActivation(variant);
      digitalActivatedCount += 1;
      continue;
    }

    await runPhysicalProcurement(
      variant,
      supplierIds,
      staffUserId,
      adminUserId,
      warehouseUserId,
      counters,
    );
  }

  console.log(`Variants left as draft (no PO / no price yet): ${draftCount}`);
  console.log(
    `Digital variants activated directly by admin: ${digitalActivatedCount}`,
  );
  console.log(`Purchase orders seeded: ${counters.purchaseOrderCount}`);
  console.log(`Purchase orders approved: ${counters.approvedCount}`);
  console.log(
    `Purchase orders moved to PROCESSING: ${counters.processingCount}`,
  );
  console.log(`Stock imports completed: ${counters.stockImportCount}`);
  console.log(
    `Variants imported but waiting for price: ${counters.importedWaitingPriceCount}`,
  );
  console.log(
    `Physical variants made sellable (price set): ${counters.sellableCount}`,
  );
}

async function upsertVariantSnapshots(variants: SeededBookVariant[]) {
  let snapshotCount = 0;

  const variantIds = variants.map((variant) => variant.id);

  // Chỉ tạo snapshot cho variant ĐANG BÁN ĐƯỢC thật sự: có giá và isActive.
  const sellableVariants = await prisma.bookVariant.findMany({
    where: {
      id: { in: variantIds },
      price: { not: null },
      isActive: true,
    },
    select: {
      id: true,
      format: true,
      price: true,
      isbn: true,
    },
  });

  for (const variant of sellableVariants) {
    if (variant.price === null) continue;

    const price = Number(variant.price);
    const contentHash = `seed-snapshot-${variant.id}-${price}`;

    const existing = await prisma.bookVariantSnapshot.findUnique({
      where: { contentHash },
      select: { id: true },
    });

    const data = {
      bookVariantId: variant.id,
      contentHash,
      priceSnapshot: price,
      currencyCodeSnapshot: CURRENCY_CODE_VND,
      formatSnapshot: variant.format,
      isbnSnapshot: variant.isbn,
    };

    if (existing) {
      await prisma.bookVariantSnapshot.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.bookVariantSnapshot.create({ data });
    }

    snapshotCount += 1;
  }

  return snapshotCount;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log('--- Seeding RBAC ---');
  const roleIdByCode = await upsertRoles();
  const permissionIdByCode = await upsertPermissions();
  await seedRolePermissions(roleIdByCode, permissionIdByCode);

  console.log('--- Seeding suppliers/languages/users/categories ---');
  const supplierIdByCode = await upsertSuppliers();
  const languageIdByCode = await upsertLanguages();
  const { admin, staff, warehouse } = await seedUsers(roleIdByCode);
  const categoryIdBySlug = await upsertCategories(languageIdByCode, admin?.id);

  if (!admin?.id) throw new Error('Missing admin user for seed');
  if (!staff?.id) throw new Error('Missing staff user for seed');
  if (!warehouse?.id) throw new Error('Missing warehouse user for seed');

  console.log(
    '--- Seeding catalog books and draft variants (no price, isActive=false) ---',
  );
  const { bookIds, variants } = await upsertCatalogBooks(
    languageIdByCode,
    categoryIdBySlug,
    admin.id,
  );

  console.log(
    '--- Seeding procurement flow (PO -> Approve -> Process -> StockImport -> Set price) ---',
  );
  await seedProcurementForVariants(
    variants,
    supplierIdByCode,
    staff.id,
    admin.id,
    warehouse.id,
  );

  console.log('--- Seeding variant snapshots for sellable variants ---');
  const snapshotCount = await upsertVariantSnapshots(variants);

  const activeBooks = bookIds.filter((_, index) => isBookActive(index)).length;
  const inactiveBooks = bookIds.length - activeBooks;

  const planCount = variants.reduce<Record<string, number>>((acc, variant) => {
    acc[variant.plan] = (acc[variant.plan] ?? 0) + 1;
    return acc;
  }, {});

  console.log(
    `Books seeded: ${bookIds.length} (${activeBooks} active, ${inactiveBooks} inactive)`,
  );
  console.log(`Variants seeded: ${variants.length}`);
  console.log('Variant plans:', planCount);
  console.log(`Variant snapshots seeded: ${snapshotCount}`);
  console.log('--- Seed completed successfully ---');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
