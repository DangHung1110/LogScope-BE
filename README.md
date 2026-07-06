# LogScope Backend

Backend API cho nền tảng observability LogScope, được xây dựng bằng NestJS và pnpm.

## Yêu cầu

- Node.js 22 trở lên
- pnpm 10 trở lên

## Khởi động

```bash
pnpm install
cp .env.example .env
pnpm start:dev
```

API mặc định chạy tại `http://localhost:3000`.

## Endpoint hiện có

| Method | Endpoint         | Mô tả                        |
| ------ | ---------------- | ---------------------------- |
| GET    | `/api/v1`        | Thông tin ứng dụng           |
| GET    | `/api/v1/health` | Trạng thái, uptime và bộ nhớ |

## Scripts

```bash
pnpm start:dev     # Chạy development với watch mode
pnpm build         # Build production
pnpm start:prod    # Chạy bản đã build
pnpm lint          # Kiểm tra ESLint
pnpm lint:fix      # Tự động sửa lỗi lint có thể sửa
pnpm format        # Kiểm tra định dạng Prettier
pnpm format:write  # Định dạng source code
pnpm typecheck     # Kiểm tra TypeScript
pnpm test          # Unit test
pnpm test:e2e      # End-to-end test
pnpm check         # Lint + typecheck + unit test
```

## Cấu trúc

```text
src/
├── config/                  # Kiểm tra và khai báo cấu hình môi trường
├── modules/
│   └── health/             # Health-check module
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── main.ts                 # Bootstrap
└── setup-app.ts            # Global middleware, CORS, versioning, pipes
test/                       # E2E tests
```

Mỗi domain mới nên nằm trong `src/modules/<domain>`, ví dụ `ingestion`, `logs`,
`traces`, `alerts` và `projects`.

## Quy ước chất lượng

- TypeScript strict mode và typed ESLint rules.
- Prettier quyết định format; ESLint kiểm tra lỗi và quy ước code.
- DTO đầu vào được whitelist, transform và từ chối field không khai báo.
- API dùng global prefix `/api` và URI versioning `/v1`.
- Biến môi trường được validate khi ứng dụng khởi động.

Trước khi commit:

```bash
pnpm check
pnpm test:e2e
pnpm build
```
