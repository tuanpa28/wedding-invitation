# Thiệp Hồng

Nền tảng thiệp cưới online cho nhiều cặp đôi, chạy miễn phí trên Cloudflare.
Kế hoạch chi tiết: [docs/PLAN.md](docs/PLAN.md).

## Công nghệ

- **Frontend:** React 19 + Vite + TypeScript, Tailwind v4, shadcn/ui
- **API:** Hono chạy trên Cloudflare Pages Functions (`functions/` → `server/`)
- **Database:** Cloudflare D1 (SQLite) + Drizzle ORM
- **Lưu file:** Cloudflare R2
- **Kiểm tra:** Vitest, ESLint, Prettier

## Chạy ở máy local

Yêu cầu: Node.js ≥ 22. Không cần tài khoản Cloudflare: D1 và R2 được giả lập trong `.wrangler/`.

```bash
npm install
npm run dev        # http://localhost:5173 (Vite) + API ở cổng 8788
```

Chạy thử bản build giống production:

```bash
npm run preview    # http://localhost:8788
```

## Các lệnh

| Lệnh                       | Tác dụng                                                 |
| -------------------------- | -------------------------------------------------------- |
| `npm run dev`              | Chạy Vite (giao diện) + wrangler (API, D1, R2) cùng lúc  |
| `npm run preview`          | Build rồi chạy như trên Cloudflare Pages                 |
| `npm run check`            | typecheck + lint + format + test (chạy trước khi commit) |
| `npm test`                 | Chạy test (Vitest, có D1 giả lập)                        |
| `npm run format`           | Format code bằng Prettier                                |
| `npm run cf-typegen`       | Sinh lại kiểu `Env` sau khi sửa `wrangler.toml`          |
| `npm run db:generate`      | Sinh migration SQL từ `server/db/schema.ts`              |
| `npm run db:migrate:local` | Áp migration vào D1 local                                |

## Cấu trúc

```
src/         React SPA (giao diện thiệp, dashboard)
functions/   Điểm vào Cloudflare Pages Functions
server/      Hono app: routes, db (Drizzle), logic
shared/      Kiểu dữ liệu dùng chung FE/BE
tests/       Test Vitest
migrations/  Migration D1 (từ Phase 2)
```

## Ghi chú

- Dùng **TypeScript 6** thay vì 7 vì `typescript-eslint` chưa hỗ trợ TS 7.
- Dùng **ESLint** thay cho oxlint vì chính sách Application Control của Windows chặn file native của oxlint.
