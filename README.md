# Bookstore Backend

NestJS backend for a multilingual bookstore and inventory management platform.

a production-style e-commerce API focused on clean REST design, authentication, RBAC, checkout reliability, payment webhook idempotency, inventory workflows, and cost-aware infrastructure choices.

## CV-Aligned Project Goals

- Build a real backend portfolio project for a Junior Back-end Developer role.
- Demonstrate layered NestJS architecture with controllers, services, repositories, DTOs, guards, filters, interceptors, queues, and scheduled jobs.
- Cover bookstore commerce flows: catalog, variants, cart, wishlist, checkout, orders, payment, suppliers, purchase orders, stock imports, and admin management.
- Use backend-focused production patterns: JWT auth, refresh sessions, token revocation, RBAC, rate limiting, Redis caching, BullMQ workers, idempotency keys, webhook inbox, immutable order snapshots, and Prisma transactions.
- Keep infrastructure practical: MySQL/MariaDB, Redis, Docker Compose, Cloudflare R2, Swagger, and background workers.

Scope note: the CV mentions reviews, but this repository snapshot does not currently expose review controllers or review routes. The route table below is generated from the current controller decorators and is the source of truth for this backend.

## Main Features

### Authentication and Security

- Email/password registration, login, logout, password reset, email verification, and password change.
- JWT access tokens plus refresh-token session storage.
- Revoked token storage for logout and invalidation.
- Device/session tracking and login-attempt records.
- Global validation pipe, Prisma exception mapping, HTTP exception mapping, response transform interceptor, and request logging interceptor.
- RBAC with `@RequirePermissions(...)`, role-permission mapping, and Redis-cached permission checks.

### Catalog and Discovery

- Multilingual book catalog with language-aware category and book translation models.
- Books, variants, authors, publishers, categories, badges, specs, images, slugs, and hierarchical categories.
- Public catalog endpoints for home data, book lists, book detail by ID or slug, and category tree.
- MySQL/MariaDB FULLTEXT search for book discovery, with Redis caching where appropriate.
- ISBN lookup flow using Google Books/OpenLibrary data for faster book data entry.
- User-event based recommendation endpoint for personalized book suggestions.

### Commerce

- Guest and authenticated shopper support.
- Guest sessions, cart, wishlist, saved user addresses, checkout, order listing, and order detail.
- Redis Lua stock reservation during checkout with database fallback.
- BullMQ checkout worker for heavier order finalization.
- Immutable `BookVariantSnapshot` records for order history so later price/variant changes do not corrupt old orders.
- Order cleanup job for expired orders and guest-session cleanup job for inactive guest data.

### Payment and Integration

- Payment intents and tokenized QR endpoint.
- Sepay webhook endpoint guarded by payment-specific guard logic.
- Webhook inbox with unique `(gateway, webhook_id)` idempotency.
- Payment status and payment history endpoints.
- Email outbox table plus BullMQ email worker with retry/backoff.

### Admin and Inventory

- Admin book management, translations, variants, price updates, snapshots, and dashboard stats.
- Admin user, category, order, stock import, and purchase order workflows.
- Supplier management.
- Purchase order approval and transfer-processing state transitions.
- Stock import creation and detail lookup by purchase order.
- Cloudflare R2 direct-upload presigned URL endpoints and book-asset confirmation endpoints.

## Tech Stack

| Layer            | Tools                                                |
| ---------------- | ---------------------------------------------------- |
| Framework        | NestJS 11, TypeScript                                |
| Database         | Prisma 7, MySQL/MariaDB                              |
| Cache and queues | Redis, BullMQ, `@nestjs/cache-manager`               |
| Search           | MySQL/MariaDB FULLTEXT, Google Books, OpenLibrary    |
| Auth             | JWT, bcrypt, cookie-parser                           |
| Storage          | Cloudflare R2 / S3-compatible storage, Sharp         |
| Docs             | Swagger via `@nestjs/swagger`                        |
| Infra            | Docker, Docker Compose, Nginx-ready deployment files |
| Testing          | Jest, Supertest, k6 performance scripts              |

## Architecture

```text
src/
├── common/          decorators, filters, interceptors, pagination, security
├── config/          typed app, auth, Redis, mail, payment, R2 config
├── database/        Prisma service, select helpers, Prisma error mapping
├── modules/         feature modules
│   ├── auth, user, guest-session, verification-code
│   ├── book, category, author, publisher, language, search, user-event
│   ├── cart, wishlist, order, payment, hooks
│   ├── permission, role, audit-log, email-outbox
│   └── admin modules for books, users, orders, stock imports, purchase orders
├── queue/           BullMQ checkout and email queues/processors
├── template/        email templates
└── utils/           hashing, slug/SKU/order-code helpers, upload helpers
```

Application bootstrap:

- Default port: `3300` unless `PORT` is set.
- Default global prefix: `/api/v1` unless `GLOBAL_PREFIX` is set.
- Swagger UI: `/api/v1/docs`.
- Global middleware: language resolver on all routes.
- Global validation: whitelist and transform enabled.

## API Routes

All paths below are relative to the default global prefix `/api/v1`.

### System

| Method | Path      | Purpose      |
| ------ | --------- | ------------ |
| GET    | `/health` | Health check |

### Authentication

| Method | Path                            | Purpose                               |
| ------ | ------------------------------- | ------------------------------------- |
| POST   | `/auth/register`                | Register a new user                   |
| POST   | `/auth/login`                   | Login with email and password         |
| GET    | `/auth/me`                      | Get current authenticated profile     |
| GET    | `/auth/device/:userId`          | Get active device sessions for a user |
| POST   | `/auth/refresh-token`           | Refresh access token                  |
| POST   | `/auth/logout`                  | Logout and revoke session/token       |
| POST   | `/auth/forgot-password`         | Send password reset email             |
| GET    | `/auth/verify-email`            | Verify email by token                 |
| POST   | `/auth/resend-email`            | Resend verification email             |
| POST   | `/auth/change-password`         | Change authenticated user password    |
| POST   | `/auth/reset-password/validate` | Validate reset token                  |
| POST   | `/auth/reset-password`          | Reset password                        |

### Public Catalog and Discovery

| Method | Path                                 | Purpose                                                 |
| ------ | ------------------------------------ | ------------------------------------------------------- |
| GET    | `/languages`                         | List active languages                                   |
| GET    | `/catalog/home`                      | Get random/home catalog books                           |
| GET    | `/catalog/books`                     | List catalog books with pagination/filtering            |
| GET    | `/catalog/books/:bookId`             | Get book detail by ID                                   |
| GET    | `/catalog/books/slug/:slug`          | Get book detail by slug                                 |
| GET    | `/catalog/categories`                | Get category tree                                       |
| GET    | `/categories`                        | List categories                                         |
| POST   | `/categories`                        | Create category                                         |
| GET    | `/authors`                           | List authors                                            |
| POST   | `/authors`                           | Create author                                           |
| GET    | `/authors/:authorId/books`           | List books by author                                    |
| GET    | `/publishers`                        | List publishers                                         |
| POST   | `/publishers`                        | Create publisher                                        |
| GET    | `/publishers/:publisherId/books`     | List books by publisher                                 |
| GET    | `/search`                            | Full-text book search                                   |
| GET    | `/search/filter`                     | Declared filter route; current service method is a stub |
| POST   | `/search/reindex`                    | Legacy reindex route; not required for FULLTEXT search  |
| GET    | `/search/isbn`                       | Look up and enrich book details by ISBN                 |
| GET    | `/user-events/hyper-recommend/books` | Get personalized recommendations                        |

### Shopper Flows

| Method | Path                                 | Purpose                             |
| ------ | ------------------------------------ | ----------------------------------- |
| GET    | `/guest-sessions`                    | List guest sessions                 |
| GET    | `/guest-sessions/:guestSessionId`    | Get guest session detail            |
| GET    | `/cart`                              | Get current user/guest cart         |
| POST   | `/cart/items`                        | Add item to cart                    |
| PATCH  | `/cart/items/:itemKey/delta`         | Change item quantity by delta       |
| DELETE | `/cart/items/:itemKey`               | Remove item from cart               |
| DELETE | `/cart`                              | Clear cart                          |
| POST   | `/cart/merge`                        | Merge guest cart into user cart     |
| GET    | `/wish`                              | Get current user/guest wishlist     |
| POST   | `/wish/items`                        | Add item to wishlist                |
| DELETE | `/wish/items/:itemKey`               | Remove wishlist item                |
| DELETE | `/wish`                              | Clear wishlist                      |
| GET    | `/user-address/user`                 | List authenticated user's addresses |
| POST   | `/user-address/user`                 | Create authenticated user's address |
| PATCH  | `/user-address/user/:id`             | Update authenticated user's address |
| PATCH  | `/user-address/user/:id/set-default` | Set default address                 |
| DELETE | `/user-address/user/:id`             | Soft-delete address                 |
| POST   | `/orders/checkout`                   | Create checkout and payment intent  |
| GET    | `/orders/`                           | List current user/guest orders      |
| GET    | `/orders/:orderId`                   | Get order detail                    |

### Payment and Webhooks

| Method | Path                              | Purpose                                |
| ------ | --------------------------------- | -------------------------------------- |
| GET    | `/payments/:token/qr`             | Get payment QR data by token           |
| POST   | `/hooks/sepay-payment`            | Receive Sepay payment webhook          |
| GET    | `/hooks/:orderCode/status`        | Get payment/order status by order code |
| GET    | `/hooks/:orderId/payment-history` | Get payment history for an order       |

### Uploads and Assets

| Method | Path                                     | Purpose                                      |
| ------ | ---------------------------------------- | -------------------------------------------- |
| POST   | `/uploads/`                              | Upload product image                         |
| POST   | `/uploads/presigned-url/book`            | Get presigned URL for one book image         |
| POST   | `/uploads/presigned-url/multipart-books` | Get presigned URLs for multiple book images  |
| POST   | `/admin/book-assets/upload`              | Upload book asset image to temporary storage |
| POST   | `/admin/book-assets/:bookId/confirm`     | Confirm temporary book asset for a book      |
| POST   | `/upload/book-asset/upload`              | Alternate book asset upload route            |
| POST   | `/upload/book-asset/:bookId/confirm`     | Alternate book asset confirmation route      |

### RBAC and Admin Utilities

| Method | Path                                        | Purpose                           |
| ------ | ------------------------------------------- | --------------------------------- |
| GET    | `/permission`                               | List permissions                  |
| PATCH  | `/permission/:id`                           | Update permission                 |
| GET    | `/role`                                     | List roles                        |
| GET    | `/role/:name`                               | Get role by name                  |
| POST   | `/role-permission`                          | Grant permission to role          |
| GET    | `/role-permission/role/:roleId`             | List permissions assigned to role |
| GET    | `/role-permission/permission/:permissionId` | List roles assigned to permission |
| GET    | `/email-outbox`                             | List email outbox records         |

### Admin Books

| Method | Path                                | Purpose                                |
| ------ | ----------------------------------- | -------------------------------------- |
| GET    | `/admin/books/stats`                | Get book dashboard stats               |
| GET    | `/admin/books/list`                 | Get detailed paginated admin book list |
| GET    | `/admin/books/:bookId`              | Get admin book detail                  |
| POST   | `/admin/books`                      | Create book                            |
| PATCH  | `/admin/books/:bookId`              | Update book                            |
| DELETE | `/admin/books/:bookId`              | Delete book                            |
| GET    | `/admin/books`                      | Get paginated admin book list          |
| POST   | `/admin/books/:bookId/translations` | Create translation for a book          |
| GET    | `/admin/book-snapshots`             | List book variant snapshots            |
| GET    | `/admin/book-variants`              | List book variants                     |
| PATCH  | `/admin/book-variants/:variantId`   | Update variant price                   |

### Admin Users, Orders, Inventory

| Method | Path                                    | Purpose                                   |
| ------ | --------------------------------------- | ----------------------------------------- |
| GET    | `/admin/users/stats`                    | Get user statistics                       |
| GET    | `/admin/users`                          | List users                                |
| GET    | `/admin/users/non-customer`             | List non-customer users                   |
| GET    | `/admin/categories/stats`               | Get category statistics                   |
| GET    | `/admin/orders`                         | List guest orders                         |
| GET    | `/admin/orders/user`                    | List registered-user orders               |
| PATCH  | `/admin/orders/:orderId/status`         | Update order status                       |
| GET    | `/admin/order-details/:orderId`         | Get order detail                          |
| POST   | `/admin/stock-imports/create`           | Create stock import record                |
| GET    | `/admin/stock-imports`                  | List stock imports                        |
| GET    | `/admin/stock-imports/:purchaseOrderId` | Get stock import detail by purchase order |

### Purchasing and Suppliers

| Method | Path                                                    | Purpose                                    |
| ------ | ------------------------------------------------------- | ------------------------------------------ |
| POST   | `/purchase-orders`                                      | Create purchase order                      |
| GET    | `/purchase-orders`                                      | List purchase orders                       |
| GET    | `/purchase-orders/:purchaseOrderId`                     | Get purchase order detail                  |
| POST   | `/purchase-orders/:purchaseOrderId/approve`             | Approve or reject purchase order           |
| POST   | `/purchase-orders/:purchaseOrderId/transfer-processing` | Move purchase order to transfer processing |
| GET    | `/suppliers`                                            | List suppliers                             |
| POST   | `/suppliers`                                            | Create supplier                            |
| PATCH  | `/suppliers/:supplierId/active`                         | Toggle supplier active status              |

Controllers currently registered without HTTP method handlers:

- `/email`
- `/r2-service`

## Background Workers and Jobs

| Worker/job         | Location                        | Purpose                                                                                |
| ------------------ | ------------------------------- | -------------------------------------------------------------------------------------- |
| Checkout queue     | `src/queue/checkout`            | Finalizes checkout data, snapshots, order items, addresses, and reserved stock updates |
| Email queue        | `src/queue/email`               | Sends outbox email jobs with retry/backoff                                             |
| Guest cleanup cron | `src/modules/guest-session/job` | Deletes inactive guest sessions and related guest data daily                           |
| Order cleanup cron | `src/modules/order/job`         | Cleans expired/pending orders every 10 hours                                           |

Run the HTTP API with `npm run start:dev`. Run the worker entrypoint with `npm run worker` when processing BullMQ jobs separately.

## Database Model Groups

- Identity: `User`, `VerificationCode`, `LoginAttempt`, `UserDevice`, `UserSession`, `RevokedToken`, `GuestSession`, `UserAddress`.
- Access control: `Role`, `UserRole`, `Permission`, `RolePermission`.
- Catalog: `Language`, `Category`, `CategoryTranslation`, `Author`, `Publisher`, `Book`, `BookTranslation`, `BookAuthor`, `BookSpec`, `BookVariant`, `BookVariantSnapshot`, assets and badges.
- Commerce: `Cart`, `CartItem`, `Wishlist`, `WishlistItem`, `Order`, `OrderItem`, `OrderAddress`.
- Payment: `PaymentTransaction`, `PaymentIntent`.
- Inventory: `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `StockImport`, `StockImportItem`.
- Engagement and integration: `UserEvent`, `AuditLog`, `EmailOutbox`, `WebhookInbox`.

## Setup

### Requirements

- Node.js 20 or newer
- MySQL 8.4 or MariaDB-compatible database
- Redis
- Docker and Docker Compose for local infrastructure
- R2/S3-compatible credentials for image upload flows
- Sepay merchant configuration for payment webhooks

### Install and Run

```bash
npm install

# Create .env from your own values or from .env.production as a template.
cp .env.production .env

npx prisma generate
npx prisma migrate deploy
npm run db:seed

npm run start:dev
```

The API runs at:

```text
http://localhost:3300/api/v1
http://localhost:3300/api/v1/docs
```

If `PORT` or `GLOBAL_PREFIX` are changed in `.env`, use those values instead.

### Docker

Local infrastructure:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Production app image:

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Environment Variables

| Group       | Variables                                                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| App         | `NODE_ENV`, `PORT`, `GLOBAL_PREFIX`                                                                                                 |
| Database    | `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `CONNECTION_LIMIT`, `CONNECTION_TIMEOUT`, `IDLE_TIMEOUT` |
| Auth        | `ACCESS_TOKEN_SECRET`, `ACCESS_TOKEN_TIME`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_TIME`, `OTP_TIME`                                |
| Redis       | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_URL`                                                                           |
| Search/data | `GOOGLE_API_KEY_BOOK`                                                                                                               |
| Mail        | `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`                                                                   |
| Payment     | `MERCHANT_ID`, `MERCHANT_SECRET_KEY`, `BANK_ID`, `ACCOUNT_NO`, `TEMPLATE_OR`, `NAME_RECEIVER`                                       |
| Storage     | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`, `R2_TOKEN_VALUE`, `CDN_URL`, `FOLDER_PRODUCT`               |
| Rate limit  | `RATE_LIMIT_LIMIT`, `RATE_LIMIT_TTL`                                                                                                |

## Scripts

| Command               | Purpose                               |
| --------------------- | ------------------------------------- |
| `npm run start`       | Start Nest normally                   |
| `npm run start:dev`   | Start Nest in watch mode with SWC     |
| `npm run start:debug` | Start Nest in debug watch mode        |
| `npm run build`       | Build the project                     |
| `npm run start:prod`  | Run built app from `dist/src/main.js` |
| `npm run worker`      | Run worker entrypoint                 |
| `npm run lint`        | Run ESLint with auto-fix              |
| `npm run format`      | Run Prettier on `src` and `test`      |
| `npm run test`        | Run unit tests                        |
| `npm run test:e2e`    | Run e2e tests                         |
| `npm run test:cov`    | Run test coverage                     |
| `npm run db:seed`     | Seed database with Prisma             |

## Documentation

- Swagger: `/api/v1/docs`
- HTML documentation index: [`doc-html/index.html`](./doc-html/index.html)
- Additional generated/reference docs: [`docs/index.html`](./docs/index.html)
- Performance scripts: [`test/performance/scripts`](./test/performance/scripts)

## License

UNLICENSED. Personal portfolio and learning project.
