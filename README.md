# 📚 Bookstore Backend

> Nền tảng thương mại điện tử sách xây dựng trên **NestJS 11 + Prisma 7 + MariaDB**, với recommendation engine tự thiết kế, semantic search bằng vector, RBAC có cache và xử lý thanh toán idempotent cấp production.

<p align="left">
  <img alt="NestJS" src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white">
  <img alt="MariaDB" src="https://img.shields.io/badge/MariaDB-003545?logo=mariadb&logoColor=white">
  <img alt="Redis" src="https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white">
</p>

📄 **Tài liệu trực quan:** mở [`doc-html/index.html`](./doc-html/index.html) — trang chỉ mục nối [báo cáo deep-dive kỹ thuật](./doc-html/engineering-deep-dive.html) và [đánh giá tiềm năng tiềm ẩn](./doc-html/hidden-potential.html).

---

## ✨ Điểm nổi bật kỹ thuật

Đây không phải một CRUD store. Sáu hệ thống dưới đây là phần có chiều sâu thật sự:

### 1. Recommendation Engine xác định (không dùng LLM runtime)
Bộ gợi ý **deterministic, giải thích được** — rẻ, nhanh, testable, ổn định:
- **Weighted event scoring + time decay:** mỗi hành vi quy về điểm ý định = `EVENT_WEIGHT × timeDecay(daysAgo)`. Mua thật (`PAYMENT_SUCCESS`) nặng gấp 12× một lượt xem; tín hiệu âm (`REMOVE_FROM_CART`, `PAYMENT_FAILED`) trừ điểm.
- **Pipeline 3 luồng:** variant events + order events → mở rộng ứng viên bằng **đồ thị mua-kèm** (co-purchase graph) từ `order_items` → hợp nhất + boost theo số lượng → `getTopKMap(20)`.
- **Sách liên quan** bằng **Jaccard Index (Intersection over Union)** trên tập category.

> `src/modules/user-event` · `src/modules/catalog` · `src/common/constants/event-type.constant.ts`

### 2. Semantic Search — Gemini Embeddings + Pinecone
- Query ngôn ngữ tự nhiên → **vector 768 chiều** (Gemini `gemini-embedding-001`) → đối sánh độ tương đồng trong Pinecone.
- **Batch reindex** (200 record/lần) chống rate-limit; bỏ qua record lỗi thay vì fail cả lô.
- **Bảo toàn thứ hạng vector** khi hydrate chi tiết từ DB, cache kết quả trong Redis.
- Gemini còn được dùng để **làm giàu dữ liệu sách** (từ Google Books) và **sinh nháp review** — luôn ép `responseJsonSchema` để đầu ra JSON đúng cấu trúc.

> `src/modules/pinecone` · `src/modules/gemini` · `src/modules/search` · `src/modules/review-ai`

### 3. Authentication nhiều lớp
- **JWT access (ngắn hạn) + refresh token opaque** lưu hash.
- **Token revocation:** `AuthGuard` verify chữ ký rồi tra blacklist → logout có hiệu lực tức thì dù token chưa hết hạn.
- **Device fingerprinting** + quản lý session theo thiết bị.
- **Chống brute-force:** tối đa 5 lần gửi OTP / 24h, backoff 5h; ghi mọi `login_attempt`.
- **Guest → User:** convert guest session khi đăng ký, giữ giỏ hàng liền mạch.

> `src/modules/auth` · `revoked-token` · `user-session` · `user-device` · `login-attempt`

### 4. RBAC có cache
- Phân quyền ở tầng guard qua decorator `@RequirePermissions(...)`.
- Quyền được cache theo role trong Redis (`role_per:{id}:perms`, TTL 1h), nạp song song → không round-trip DB mỗi request.
- Mô hình chuẩn hoá: `User → UserRole → Role → RolePermission → Permission` với composite unique key.

> `src/common/security/guard/permission.guard.ts` · `src/modules/{permission,role,role-permission,user-role}`

### 5. Payment & Outbox Pattern
- **Webhook Sepay idempotent:** lưu `webhook_inbox` với composite unique `(gateway, providerEventId)` bằng `upsert` → bắn lại nhiều lần cũng chỉ xử lý một lần.
- Cập nhật order + payment trong **một transaction** (nguyên tử).
- **Outbox pattern** cho email: ghi `email_outbox` (PENDING) → BullMQ với `jobId` idempotent + **exponential backoff** (3 lần, 3s→9s→27s).

> `src/modules/hooks` · `src/modules/payment` · `src/modules/jobs` · `src/modules/email-outbox`

### 6. Toàn vẹn dữ liệu (Data Integrity)
- **Snapshot pattern:** `OrderItem` trỏ tới `BookVariantSnapshot` (giá/SKU đông cứng) → đổi giá sau này không làm sai đơn cũ.
- **Audit log** lưu JSON `before`/`after` + actor + IP.
- **onDelete matrix** có chủ đích (`Cascade`/`Restrict`/`SetNull`/`NoAction`), tài liệu hoá tại [`docs/schema-ondelete-matrix.md`](./docs/schema-ondelete-matrix.md).

---

## 🏗️ Kiến trúc

```
src/
├── common/            # decorators, filters, interceptors, pagination, security (guards/RBAC)
├── config/            # cấu hình tập trung
├── database/          # Prisma service, selects, error mapping
└── modules/           # 50+ feature modules
    ├── auth, user-session, user-device, login-attempt, revoked-token, verification-code
    ├── catalog, user-event, search, pinecone, gemini, review-ai     # discovery & AI
    ├── cart, order, payment, hooks, payment-intent                  # commerce & payment
    ├── permission, role, role-permission, user-role                 # RBAC
    ├── jobs, mail, email-outbox                                     # async / queue
    ├── admin/ (book, order, user...)                                # admin panel
    └── book*, author, publisher, category, stock-import, ...        # catalog domain
```

- **Cross-cutting:** `TransformInterceptor` chuẩn hoá response, `PrismaExceptionFilter` map lỗi DB (P2002/P2025) sang HTTP, `LanguageMiddleware` cho đa ngôn ngữ.
- **Tài liệu chi tiết:** xem thư mục [`docs/`](./docs/) (enterprise structure, RBAC, schema, deploy AWS, workflows...).

---

## 🛠️ Tech Stack

| Lớp | Công nghệ |
|-----|-----------|
| Framework | NestJS 11 (Express) |
| ORM / DB | Prisma 7 · MariaDB / MySQL 8.4 |
| Cache / Queue | Redis · BullMQ · `@nestjs/cache-manager` |
| AI / Search | Google Gemini · Pinecone (vector DB) |
| Auth | JWT (`@nestjs/jwt`) · bcrypt |
| Storage | Cloudflare R2 (S3-compatible) · Sharp |
| Realtime | Socket.IO (`@nestjs/websockets`) |
| Mail | Nodemailer (qua outbox + queue) |
| Payment | Sepay (QR webhook) |
| Docs | Swagger (`@nestjs/swagger`) |
| Infra | Docker · Nginx · AWS EC2 · Terraform · GitHub Actions |

---

## 🚀 Bắt đầu

### Yêu cầu
- Node.js ≥ 20 (khuyến nghị 24.x)
- Docker & Docker Compose
- Redis (cache + queue)
- Tài khoản Gemini API & Pinecone (cho AI search)

### Cài đặt

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file env (xem bảng biến môi trường bên dưới)
cp .env.production .env   # rồi điền giá trị

# 3. Sinh Prisma client & đẩy schema
npx prisma generate
npx prisma migrate deploy   # hoặc: npx prisma db push

# 4. Seed dữ liệu mẫu (tuỳ chọn)
npm run db:seed

# 5. Chạy ở chế độ dev (watch + SWC)
npm run start:dev
```

### Chạy bằng Docker

```bash
# Môi trường dev (MySQL + app)
docker compose -f docker-compose.dev.yml up --build

# Production
docker compose -f docker-compose.prod.yml up -d
```

API mặc định chạy tại `http://localhost:3301` (theo `PORT`). Swagger docs tại `/docs`.

---

## 🔑 Biến môi trường chính

| Nhóm | Biến |
|------|------|
| Database | `DATABASE_URL`, `MYSQL_*` |
| Auth | `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `ACCESS_TOKEN_TIME`, `REFRESH_TOKEN_TIME`, `OTP_TIME` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD` |
| AI / Search | `GEMINI_API_KEY`, `GEMINI_MODEL`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `GOOGLE_API_KEY_BOOK` |
| Mail | `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS` |
| Payment (Sepay) | `MERCHANT_ID`, `MERCHANT_SECRET_KEY`, `BANK_ID`, `ACCOUNT_NO`, `TEMPLATE_OR` |
| Storage (R2) | `CDN_URL`, `FOLDER_PRODUCT`, các khoá R2 |
| Rate limit | `RATE_LIMIT_LIMIT`, `RATE_LIMIT_TTL` |

---

## 📜 Scripts hữu ích

```bash
npm run start:dev        # dev watch (SWC)
npm run start:prod       # chạy bản build
npm run build            # nest build
npm run lint             # eslint --fix
npm run test             # unit test (Jest)
npm run test:e2e         # e2e test
npm run db:seed          # seed dữ liệu
npm run contract:export  # export API contract
```

---

## 🗺️ Hướng phát triển tiếp

Những hạng mục đang đào sâu để nâng chất lượng hệ thống (chi tiết &amp; roadmap ưu tiên trong [đánh giá tiềm năng tiềm ẩn](./doc-html/hidden-potential.html)):

- [ ] Metric đánh giá chất lượng recommendation (hit-rate@K, coverage) + A/B test
- [ ] Cache invalidation cho phân quyền khi grant/revoke
- [ ] Refresh token rotation + reuse detection
- [ ] Xác thực chữ ký webhook thanh toán (chống giả mạo callback)
- [ ] Hybrid reranking: kết hợp điểm hành vi + điểm ngữ nghĩa
- [ ] Mở rộng test coverage & observability (structured logging, tracing)

---

## 📄 License

UNLICENSED — dự án cá nhân phục vụ học tập & portfolio.
