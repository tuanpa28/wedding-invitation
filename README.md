# Thiệp Hồng

Nền tảng thiệp cưới online cho nhiều cặp đôi: mỗi cặp có một link thiệp, mỗi khách có link riêng mang tên mình.
Kế hoạch chi tiết: [docs/PLAN.md](docs/PLAN.md).

## Công nghệ

- **Next.js 16** (App Router): giao diện + API (Route Handlers trong `src/app/api`)
- **Postgres** + **Drizzle ORM**: local chạy bằng Docker, production dùng Neon
- **Better Auth**: đăng nhập Google (khách mời không cần đăng nhập)
- **Cloudinary**: lưu ảnh/nhạc cặp đôi tải lên (upload thẳng từ trình duyệt)
- Tailwind v4, shadcn/ui
- Vitest, Playwright (E2E), ESLint, Prettier

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

Mở http://localhost:3000. Trang chủ có link vào trang quản lý, 3 thiệp mẫu và trạng thái API/database.

## Trang quản lý (dashboard)

Vào http://localhost:3000/dashboard. Khi chưa cấu hình Google, đăng nhập bằng **tài khoản thử**: nhập email bất kỳ (ví dụ `ban@thiephong.test`) và mật khẩu ≥ 8 ký tự, email chưa có sẽ được tạo mới. Tài khoản thử chỉ bật khi `DEV_LOGIN=true` **và** `DATABASE_URL` trỏ tới Postgres trên máy, nên không thể bật trên Vercel/Neon.

Trong dashboard:

- **Tạo thiệp:** tên hai bạn → đường dẫn (tự gợi ý, kiểm tra trùng) → chọn mẫu. Thiệp mới là bản nháp.
- **Sửa thiệp:** thông tin hai bên gia đình, sự kiện từng bên, ảnh bìa/album/nhạc, chuyện tình. Khung điện thoại bên phải hiện đúng thiệp khách sẽ thấy (đổi được "Khách nhà trai / nhà gái").
- **Gửi thiệp:** cần ít nhất một sự kiện. Gửi xong khách mở link được ngay (cache được xoá tự động).
- **Người quản lý:** người tạo thiệp tạo link mời (dùng một lần, hạn 7 ngày) để người còn lại cùng sửa.

### Đăng nhập Google (khi cần)

1. Vào [Google Cloud Console](https://console.cloud.google.com/) → tạo project → **APIs & Services → OAuth consent screen** (External, điền tên app).
2. **Credentials → Create credentials → OAuth client ID** → loại _Web application_.
3. _Authorized redirect URIs_: `http://localhost:3000/api/auth/callback/google` (sau này thêm `https://<tên-app>.vercel.app/api/auth/callback/google`).
4. Chép Client ID / Client secret vào `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` trong `.env.local`, rồi khởi động lại `npm run dev`.

### Tải ảnh/nhạc (Cloudinary, khi cần)

1. Tạo tài khoản miễn phí tại [cloudinary.com](https://cloudinary.com/).
2. Trong **Dashboard** (hoặc _Settings → API Keys_) lấy _Cloud name_, _API Key_, _API Secret_.
3. Điền `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` vào `.env.local`, khởi động lại `npm run dev`.

Chưa cấu hình thì nút tải ảnh/nhạc bị tắt và thiệp dùng ảnh bìa mặc định; vẫn dán được link nhạc `https://`.

Thiệp mẫu (đọc từ Postgres sau khi seed): `/demo`, `/demo/nam2027` (khách nhà trai), `/demo/cohoa27` (khách nhà gái), `/anh-thu`, `/anh-thu/chimai`. `/ban-nhap` là bản nháp nên báo không tìm thấy. Thêm `?t=song-hy`, `?t=thanh-lich` hoặc `?t=hoa-co` để đổi template.

## Các lệnh

| Lệnh                  | Tác dụng                                                   |
| --------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Chạy Next.js ở chế độ dev                                  |
| `npm run build`       | Build production                                           |
| `npm run check`       | typecheck + lint + format + test (chạy trước khi commit)   |
| `npm test`            | Chạy Vitest (dùng database `thiephong_test`)               |
| `npm run test:e2e`    | Build production rồi chạy Playwright trên Edge (cổng 3100) |
| `npm run format`      | Format code bằng Prettier                                  |
| `npm run db:up`       | Bật Postgres local (Docker, cổng 5434)                     |
| `npm run db:down`     | Tắt Postgres local                                         |
| `npm run db:generate` | Sinh migration từ `src/server/db/schema.ts`                |
| `npm run db:migrate`  | Áp migration vào database                                  |
| `npm run db:studio`   | Mở Drizzle Studio để xem dữ liệu                           |

## Cấu trúc

```
src/
  app/          Trang (Server Components) + API (app/api/**/route.ts)
  server/       Backend: db, auth, services, phân quyền (chỉ chạy phía server)
  components/   Component giao diện (components/ui là shadcn)
  lib/          Hàm và kiểu dùng chung FE/BE (lib/invitation: lọc sự kiện, lịch, đếm ngược)
  templates/    Các mẫu thiệp: song-hy, thanh-lich, hoa-co
  mocks/        Dữ liệu thiệp mẫu (Phase 1)
tests/          Vitest
e2e/            Playwright
drizzle/        Migration SQL
docker/         Script khởi tạo Postgres local
```

## Xoá cache thiệp

Trang thiệp được cache. Dashboard tự xoá cache mỗi lần lưu. Chỉ khi sửa dữ liệu thẳng trong database mới cần gọi:

```bash
curl -X POST http://localhost:3000/api/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET" -H "Content-Type: application/json" -d '{"slug":"demo"}'
```

## Ghi chú

- **TypeScript được ghim ở bản 6:** typescript-eslint chưa hỗ trợ TS 7.
- **Không dùng oxlint/Biome:** chính sách Application Control của Windows chặn file native của oxlint.
- **npm 11 chặn script cài đặt mặc định.** Các package được phép chạy script nằm trong `allowScripts` của `package.json`.
