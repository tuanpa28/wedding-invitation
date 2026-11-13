# Thiệp Hồng

Nền tảng thiệp cưới online cho nhiều cặp đôi: mỗi cặp có một link thiệp, mỗi khách có link riêng mang tên mình.
Kế hoạch chi tiết: [docs/PLAN.md](docs/PLAN.md).

## Công nghệ

- **Next.js 16** (App Router): giao diện + API (Route Handlers trong `src/app/api`)
- **Postgres** + **Drizzle ORM**: local chạy bằng Docker, production dùng Neon
- Tailwind v4, shadcn/ui
- Vitest, ESLint, Prettier

## Chạy ở máy local

Yêu cầu: Node.js ≥ 22, Docker Desktop.

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run db:up
```

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

```bash
npm run dev
```

Mở http://localhost:3000. Trang chủ có link xem 3 thiệp mẫu và trạng thái API/database.

Thiệp mẫu (đọc từ Postgres sau khi seed): `/demo`, `/demo/nam2027` (khách nhà trai), `/demo/cohoa27` (khách nhà gái), `/anh-thu`, `/anh-thu/chimai`. `/ban-nhap` là bản nháp nên báo không tìm thấy. Thêm `?t=song-hy`, `?t=thanh-lich` hoặc `?t=hoa-co` để đổi template.

## Các lệnh

| Lệnh                  | Tác dụng                                                 |
| --------------------- | -------------------------------------------------------- |
| `npm run dev`         | Chạy Next.js ở chế độ dev                                |
| `npm run build`       | Build production                                         |
| `npm run check`       | typecheck + lint + format + test (chạy trước khi commit) |
| `npm test`            | Chạy Vitest (dùng database `thiephong_test`)             |
| `npm run format`      | Format code bằng Prettier                                |
| `npm run db:up`       | Bật Postgres local (Docker, cổng 5434)                   |
| `npm run db:down`     | Tắt Postgres local                                       |
| `npm run db:generate` | Sinh migration từ `src/server/db/schema.ts`              |
| `npm run db:migrate`  | Áp migration vào database                                |
| `npm run db:studio`   | Mở Drizzle Studio để xem dữ liệu                         |

## Cấu trúc

```
src/
  app/          Trang (Server Components) + API (app/api/**/route.ts)
  server/       Backend: db, services, phân quyền (chỉ chạy phía server)
  components/   Component giao diện (components/ui là shadcn)
  lib/          Hàm và kiểu dùng chung FE/BE (lib/invitation: lọc sự kiện, lịch, đếm ngược)
  templates/    Các mẫu thiệp: song-hy, thanh-lich, hoa-co
  mocks/        Dữ liệu thiệp mẫu (Phase 1)
tests/          Vitest
drizzle/        Migration SQL
docker/         Script khởi tạo Postgres local
```

## Xoá cache thiệp

Trang thiệp được cache. Nếu sửa dữ liệu thẳng trong database, gọi:

```bash
curl -X POST http://localhost:3000/api/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"slug":"demo"}'
```

## Ghi chú

- **TypeScript được ghim ở bản 6:** typescript-eslint chưa hỗ trợ TS 7.
- **Không dùng oxlint/Biome:** chính sách Application Control của Windows chặn file native của oxlint.
- **npm 11 chặn script cài đặt mặc định.** Các package được phép chạy script nằm trong `allowScripts` của `package.json`.
