# Brainstorm Template — NestJS + Prisma (CRUD + page/limit)

## Problem

Tự động scaffold một NestJS feature CRUD dùng Prisma theo conventions repo:

- module/controller/service/repository/dto
- validation + (swagger nếu repo có)
- list endpoint dùng pagination thường (page/limit), kèm filter/sort cơ bản
- xử lý các edge case phổ biến của schema: BigInt id, soft delete (deletedAt), isActive/status enums

## Trigger Phrases

Các prompt nên kích hoạt:

- "Tạo CRUD module NestJS cho <resource> dùng Prisma, pagination page/limit"
- "Scaffold controller/service/dto cho <resource> Prisma theo style repo"
- "Generate list endpoint có page/limit + sort + filter cho <resource>"
- "Thêm CRUD cho <resource> với soft delete (deletedAt) và map lỗi Prisma"

Không nên kích hoạt:

- "Giải thích NestJS/Prisma" (lý thuyết)
- "Debug docker/CI/deploy" (hạ tầng)
- "Refactor kiến trúc toàn dự án"
- "Tối ưu query nâng cao/benchmark" (skill riêng)

## Output Expectations

Codex phải produce:

1. API plan (CRUD REST):

- POST /<resource>
- GET /<resource> (page/limit + filter + sort)
- GET /<resource>/:id
- PATCH /<resource>/:id
- DELETE /<resource>/:id (soft delete nếu model có deletedAt)

2. File tree + code hoàn chỉnh:

- <resource>.module.ts
- <resource>.controller.ts
- <resource>.service.ts
- <resource>.repository.ts
- dto/create-\*.dto.ts
- dto/update-\*.dto.ts
- dto/query-\*.dto.ts (page/limit + sort + filter)

3. Prisma integration:

- dùng PrismaService hiện có
- list: prisma.<model>.findMany({ skip, take, where, orderBy })
- total: prisma.<model>.count({ where })
- ưu tiên prisma.$transaction([count, findMany]) để đồng bộ

4. Response shape cho list:

- { data: [...], meta: { page, limit, total, totalPages } }
  (hoặc theo response envelope của repo)

5. Validation:

- page >= 1, limit trong range (vd 1..100)
- sortOrder in [asc, desc]
- parse number/boolean đúng cách (class-transformer)

6. Swagger:

- chỉ thêm nếu repo đã có @nestjs/swagger

7. Tests tối thiểu:

- unit test service (list + create) hoặc theo pattern repo
- không introduce framework mới

## Constraints

- Repo-first: phải đọc conventions repo trước khi generate (naming, response format, error handling).
- Không thêm thư viện mới nếu repo chưa dùng.
- Pagination bắt buộc là page/limit (không cursor).
- Soft delete:
  - nếu model có deletedAt: list mặc định where: { deletedAt: null }
  - delete => update deletedAt = now (trừ khi repo làm hard delete)
- BigInt:
  - nhiều model dùng BigInt id => tránh JSON serialize lỗi (BigInt -> string) theo strategy repo
  - parse param :id đúng kiểu (string -> BigInt)
- Error mapping Prisma:
  - unique constraint (P2002) -> 409 (hoặc theo repo)
  - not found -> 404
  - validation -> 400
- Code phải compile, không pseudo-code.

## Reusable Resources

- scripts:
  - detect_stack.ts: detect swagger/jest, find PrismaService path, detect response envelope, detect BigInt serialization strategy (nếu có).
  - verify_feature.ts: check file tree + imports + basic lint/test command exist.

- references:
  - crud_api_contract.md: spec page/limit + meta response + default sort.
  - prisma_error_mapping.md: mapping P2002/P2025 theo convention.
  - repo_conventions.md: folder layout + naming + guard/auth patterns.

- assets:
  - dto_query_page_limit.ts.tpl: Query DTO chuẩn page/limit + sortOrder + optional filters.
  - prisma_list_service.ts.tpl: list() using $transaction(count + findMany)
  - test_service.spec.ts.tpl: minimal unit test skeleton

## Edge Cases

- Model có deletedAt: cần exclude deleted.
- Model có isActive/status enum: filter mặc định (vd isActive=true) nếu repo dùng.
- BigInt id: JSON serialize và pipe parse id.
- Sort fields: user gửi sortBy không hợp lệ => validate/whitelist.
- Relations: include/select (không trả field nhạy cảm), repo có rule riêng.
- Pagination limit quá lớn: clamp về maxLimit.

## Success Criteria

- Module/controller/service compile.
- GET list trả đúng data + meta page/limit.
- Soft delete đúng (nếu có deletedAt).
- Không bị lỗi serialize BigInt trong response (theo cách repo đang xử lý).
- Tests tối thiểu chạy được bằng test runner hiện có.
- Không introduce libs mới.
