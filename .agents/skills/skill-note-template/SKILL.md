---
name: nestjs-feature-skill-notes
description: Notes for a Codex skill that scaffolds a NestJS feature module (CRUD REST) with controller/service/dtos/validation/swagger/tests, aligned with the repo’s existing architecture and tooling (Prisma/TypeORM/Mongoose optional).
---

# Skill Note Template — NestJS Feature Scaffold

## 1) Goal

Enable another Codex instance to generate a production-quality NestJS feature module (CRUD REST) that matches the current repo patterns: module/controller/service/repository/DTOs, validation, Swagger, and basic tests.

## 2) Trigger Notes (for frontmatter description)

Update the `description` field in frontmatter first. It is the main trigger signal.

### Should trigger
- "Tạo module CRUD cho resource X trong NestJS"
- "Scaffold controller/service/dto cho feature Y"
- "Thêm validation + swagger cho endpoint NestJS"
- "Tạo REST endpoints + tests theo structure hiện tại"

### Should NOT trigger
- "Debug lỗi runtime / deploy / docker" (dành skill khác)
- "Chỉ hỏi lý thuyết NestJS" (trả lời bình thường)
- "Refactor lớn toàn dự án" (skill refactor riêng)

## 3) Workflow Draft

Workflow-based

1. Inspect repo conventions (structure, naming, DI patterns, validation, swagger setup, test stack).
2. Ask missing requirements (resource name, fields, DB/ORM choice, auth/roles, pagination/filtering).
3. Generate files (module/controller/service/repository/dtos + optional entity/schema + swagger).
4. Wire into AppModule (if needed), export providers, update barrel/index if repo dùng.
5. Add tests (unit or e2e minimal) + run commands + verify compilation.

## 4) Reusable Resources Plan

### scripts/
- `scripts/detect-stack.ts` - detect NestJS version + ORM (prisma) + test runner.
- `scripts/validate-module.ts` - check required files exist + imports compile.

### references/
- `references/nestjs-crud-checklist.md` - canonical checklist endpoints, DTO rules, error mapping.
- `references/repo-conventions.md` - naming, folder structure, lint rules (để copy từ repo).
- `crud_api_contract.md` - chuẩn trả về 
### assets/
- `assets/dto.templates/` - templates for Create/Update/Query DTOs (optional).
- `assets/test.templates/` - templates for controller/service specs (optional).

## 5) Real Request Examples

1. "Tạo CRUD module `products` với Prisma, fields: name, price, sku unique, status enum."
2. "Scaffold feature `users`  với pagination, filter theo role."
3. "Thêm DTO validation + swagger cho `orders` endpoints; giữ style code hiện có."
4. "Tạo module `categories` (không DB) dùng in-memory service cho demo + tests."

## 6) Validation Checklist

- [ ] Frontmatter has only `name` and `description`
- [ ] Description clearly states what + when to use
- [ ] Body is concise, procedural, repo-aware
- [ ] Generated code compiles and follows repo conventions
- [ ] Includes minimal tests and Swagger decorators where applicable
- [ ] Remove unused folders/files before finalizing
