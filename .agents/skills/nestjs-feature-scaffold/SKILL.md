---
name: nestjs-feature-scaffold
description: Use when you need to scaffold or extend a NestJS feature module for a REST CRUD resource (module/controller/service/DTOs), matching the repository’s existing patterns and tooling (validation, Swagger, tests). Do NOT use for general NestJS theory, infra/deploy debugging, or broad refactors.
---

# NestJS Feature Scaffold

## When to use
Use this skill when the user asks to:
- Create a new NestJS feature module/resource (CRUD REST).
- Add/adjust controller/service methods for a resource.
- Add DTO validation (`class-validator`) and Swagger decorators.
- Add minimal tests (unit or e2e) consistent with the repo.

Do NOT use this skill when the user asks to:
- Debug deployment/Docker/K8s/CI or runtime infra issues.
- Provide conceptual NestJS explanations only.
- Perform large-scale refactors across many modules.

## What you must do first (repo-aware)
1. Inspect the repo to infer conventions:
   - NestJS version (package.json)
   - folder structure (src/*), naming patterns
   - existing DTO/validation patterns
   - Swagger usage (`@nestjs/swagger`) presence
   - test stack (jest / vitest, e2e patterns)
   - data layer tooling if present (Prisma/TypeORM/Mongoose) and how repositories are implemented

2. If any requirement is missing, ask only for the minimum set:
   - Resource/feature name (singular + plural; route prefix)
   - Fields (name/type/required/unique/default), and which fields are filterable/sortable
   - Data layer choice: Prisma / TypeORM / Mongoose / none
   - Auth: none / JWT guard / roles (and which endpoints are protected)
   - Pagination style (page/limit vs cursor), default sort

## Output contract
Always return:
- Proposed file tree (what you will create/modify)
- Code changes (files + snippets) following repo style
- Commands to run (lint/test/build) if applicable
- Notes about assumptions you made

## Workflow (CRUD REST)
Follow these steps in order.

### Step 1 — Define the API surface
Create a clear endpoint plan:
- `POST /<resource>` create
- `GET /<resource>` list (pagination + filter + sort)
- `GET /<resource>/:id` get one
- `PATCH /<resource>/:id` update
- `DELETE /<resource>/:id` delete (soft-delete if repo uses it)

Map expected responses and error cases:
- 400 validation errors
- 404 not found
- 409 conflict for unique fields (if applicable)

### Step 2 — Generate module structure
Create/modify:
- `<feature>.module.ts`
- `<feature>.controller.ts`
- `<feature>.service.ts`
- `dto/create-*.dto.ts`, `dto/update-*.dto.ts`, optional `dto/query-*.dto.ts`
- Optional entity/schema/repository adapters depending on tooling

Keep naming consistent with repo:
- If repo uses “repository” layer, add it.
- If repo uses “use-cases” or “handlers”, mirror that.

### Step 3 — DTOs, validation, and transforms
- Use `class-validator` + `class-transformer` patterns already present in repo.
- For query DTOs: parse numbers/booleans properly; validate enums; allow optional filters.
- For update DTOs: partial fields, but still validate types.

### Step 4 — Swagger decorators (if repo uses Swagger)
- Add `@ApiTags`, `@ApiOperation`, `@ApiResponse`/`@ApiOkResponse`, `@ApiBearerAuth` (if protected)
- Add DTO schemas to Swagger automatically where possible

If repo does not use Swagger, do not introduce it.

### Step 5 — Data layer integration (choose the correct branch)
Pick ONE branch based on repo detection or explicit user requirement.

- Prisma:
  - Implement service using Prisma client patterns in repo.
  - Handle unique constraints (translate to 409 if repo does so).
- TypeORM:
  - Add entity + repository injection patterns used in repo.
- Mongoose:
  - Add schema + model injection patterns used in repo.
- None:
  - Use in-memory store or stub interface consistent with repo conventions.

### Step 6 — Tests
Add minimal tests consistent with repo:
- Unit tests for service logic OR controller tests if that’s the repo standard.
- If repo has e2e setup, add one minimal e2e for list/create.

Do not introduce a new test framework.

### Step 7 — Wire-up and verify
- Ensure module is imported/exported correctly.
- Ensure compilation passes.
- Provide run commands (e.g., `npm test`, `npm run lint`, `npm run build`) that match the repo scripts.

## Definition of done
- [ ] Module/controller/service compile
- [ ] DTO validation works and matches repo patterns
- [ ] Endpoints are implemented as planned
- [ ] Error mapping matches repo conventions
- [ ] Swagger is added only if repo already uses it
- [ ] Minimal tests added and runnable with existing test stack
