# Plan v3: Thiệp Hồng — Next.js (FE + API) trên Vercel

## Context

Bạn đổi hướng: dùng **Next.js** cho cả giao diện lẫn API (Route Handlers), không tách app riêng nữa. Host trên **Vercel + Neon Postgres**. Code Phase 0a cũ (React + Vite + Hono + Cloudflare) vẫn giữ trong lịch sử git (commit `faf0244`). Working tree sẽ được dọn và dựng lại từ đầu bằng Next.js, rồi tạo commit mới.

Yêu cầu giữ nguyên: nền tảng cho **nhiều cặp đôi**, đám cưới **2 bên nhà trai/nhà gái**, có RSVP + lời chúc, link riêng cho từng khách, trang quản lý, QR mừng cưới. **0đ**, **không gửi email**, **không thu phí**, làm **từng phase**, test ổn mới qua phase tiếp. Tên: **Thiệp Hồng**.

---

## 1. Công nghệ

| Thành phần   | Chọn                                                                                             | Free tier                                  |
| ------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| Framework    | **Next.js 16** (App Router) + TypeScript 6                                                       | —                                          |
| Giao diện    | Tailwind v4 + shadcn/ui (dashboard), CSS animation cho thiệp                                     | —                                          |
| API          | **Next.js Route Handlers** `src/app/api/**/route.ts`                                             | chạy trong Vercel Functions                |
| Database     | **Postgres**: local chạy bằng Docker, production dùng **Neon**                                   | Neon: 0.5 GB, tự ngủ khi không có truy cập |
| ORM          | **Drizzle ORM** + driver `pg` (dùng chung một driver cho local và Neon) + drizzle-kit migrations | —                                          |
| Đăng nhập    | **Better Auth**: chỉ Google login, session lưu trong Postgres                                    | free, không cần email                      |
| Ảnh / nhạc   | **Cloudinary**: trình duyệt upload thẳng lên, API chỉ ký chữ ký upload                           | 25 credits/tháng                           |
| Hosting      | **Vercel Hobby**, mỗi nhánh có link preview riêng                                                | free (không thu phí nên dùng Hobby hợp lệ) |
| Chống spam   | Honeypot + Cloudflare Turnstile + giới hạn số lần gửi theo IP (lưu trong DB)                     | free                                       |
| QR mừng cưới | VietQR (`img.vietqr.io`)                                                                         | free                                       |
| Test         | Vitest (logic + API trên Postgres test) và Playwright (e2e, Phase 3+)                            | —                                          |
| Lint/format  | ESLint + Prettier                                                                                | —                                          |

**Rút kinh nghiệm từ Phase 0a:**

- **Không dùng oxlint/Biome:** chính sách Application Control của Windows chặn file native của oxlint.
- **Ghim TypeScript 6:** typescript-eslint chưa hỗ trợ TS 7.
- **npm 11 chặn script cài đặt:** các package cần chạy script lúc cài phải được cho phép qua `allowScripts`.
- **Chạy dev server bằng launch config của app.** Trước khi đổi cấu trúc thư mục, phải dừng dev server của bạn (Vite từng khoá thư mục).

---

## 2. Kiến trúc: FE và BE trong một app Next.js, tách theo lớp

```
Trình duyệt ──► Next.js (Vercel)
                 ├─ Pages (Server Components): thiệp /[slug], dashboard, admin
                 │     └─ đọc dữ liệu: gọi thẳng src/server/services (không tự gọi HTTP chính mình)
                 ├─ API Route Handlers /api/*: mọi thao tác ghi (RSVP, lời chúc, CRUD dashboard, tracking, ký upload)
                 │     └─ validate bằng zod → gọi src/server/services
                 └─ src/server/** (BE): services, db, auth, phân quyền — import 'server-only'
                          │                     │
                          ▼                     ▼
                    Postgres (Neon)        Cloudinary
```

- **Tách FE/BE trong cùng repo:**
  - `src/server/` là backend thuần, có `import 'server-only'` nên bị chặn nếu lỡ import vào code client.
  - `src/app/api/` chỉ là lớp HTTP mỏng.
  - `src/lib/validators` chứa schema zod dùng chung cho form FE và API.
- **Thao tác ghi đều đi qua API** (fetch + TanStack Query ở dashboard). Không dùng Server Actions, để API rõ ràng và test được.
- **Thiệp khách mời:**
  - Render phía server.
  - Cache theo tag; khi cặp đôi sửa thì gọi `revalidateTag` để khách thấy ngay.
  - `generateMetadata` + `opengraph-image.tsx` tạo ảnh preview có tên khách khi share lên Zalo/Messenger.
- **Đa cặp đôi theo path:** `/tuan-lan` là thiệp chung, `/tuan-lan/a8Kx2pQe` là thiệp riêng một khách. Các slug hệ thống như `api`, `dashboard`, `login`, `admin`, `_next` được giữ lại.

---

## 3. Luồng hoạt động _(giữ như plan cũ)_

- **Cặp đôi:**
  1. Đăng nhập Google, đi qua wizard tạo thiệp.
  2. Nhập sự kiện từng bên, upload ảnh/nhạc, nhập tài khoản ngân hàng.
  3. Thêm khách (tay hoặc import Excel).
  4. Publish, rồi copy link/tin nhắn gửi Zalo.
  5. Theo dõi ai đã mở, RSVP, lời chúc; export Excel.
  6. Mời người còn lại đồng quản lý.
- **Khách mời:**
  1. Mở link riêng, thấy phong bì "Kính mời anh Nam", bấm mở thì nhạc phát.
  2. Chỉ thấy sự kiện của bên mình. Có đếm ngược, album, chỉ đường, lưu lịch (.ics / Google Calendar).
  3. Gửi RSVP, lời chúc, quét QR mừng cưới.

## 4. Database (Drizzle, Postgres)

- **Bảng của Better Auth:** `user` (+ `role`), `session`, `account`, `verification`.
- **Bảng nghiệp vụ:** `weddings`, `wedding_members`, `wedding_invites`, `events`, `guests`, `rsvps`, `wishes`, `bank_accounts`, `photos`, `rate_limits`. Cột giống plan cũ; dùng `timestamptz`, `jsonb` cho theme/settings và enum Postgres cho side/status.
- **Phân quyền:** mọi API dashboard đều gọi `requireWeddingAccess(weddingId)`.
- **Giới hạn mỗi thiệp:** 40 ảnh, 1 nhạc ≤ 8 MB, 1.000 khách.

## 5. Cấu trúc thư mục

```
src/
  app/
    page.tsx                         # landing Thiệp Hồng
    [slug]/page.tsx                  # thiệp chung
    [slug]/[guestCode]/page.tsx      # thiệp theo khách
    [slug]/[guestCode]/opengraph-image.tsx
    dashboard/…  admin/…  login/
    api/health/route.ts
    api/auth/[...all]/route.ts       # Better Auth
    api/weddings/…  api/guests/…  api/rsvp/…  api/wishes/…  api/track/…  api/uploads/sign/…
  server/                            # BE (server-only)
    db/schema.ts  db/index.ts
    services/  auth.ts  permissions.ts
  templates/sections/  templates/song-hy/  templates/thanh-lich/  templates/hoa-co/
  components/ui/                     # shadcn
  lib/                               # ics, vietqr, format ngày, validators (zod), side filter
drizzle/                             # migrations
tests/  e2e/
docker-compose.yml                   # Postgres 17 local (db dev + db test)
.env.example
```

## 6. Template (Phase 1)

1. **Song Hỷ**:
   - Nền son mài đỏ thẫm, chữ vàng kim nhạt, phần chi tiết trình bày trên giấy dó.
   - Font Prata + Alegreya.
   - **Điểm nhấn:** phong bì là hai cánh cổng có con dấu 囍 chia đôi, bấm mở thì hai cánh tách ra.
2. **Thanh Lịch**:
   - Tối giản lạnh: navy mực, trắng giấy, xám xanh.
   - Font Be Vietnam Pro (font do người Việt thiết kế) + Fraunces italic.
   - **Điểm nhấn:** tờ lịch tháng cưới cỡ lớn, ngày cưới được khoanh tay.
3. **Hoa Cỏ**:
   - Nền trắng ánh xanh lá, xanh lá xám, hồng phấn, tím bằng lăng.
   - Font Dancing Script + Quicksand.
   - **Điểm nhấn:** cành hoa dại SVG tự "mọc" (vẽ nét) khi cuộn trang.

Ba template dùng chung các section: Phong bì, Lời mời (bố mẹ 2 bên), Đếm ngược, Sự kiện, Chuyện tình, Album (lightbox), Lời cảm ơn, Nút nhạc. Mọi font đều có bộ ký tự tiếng Việt và tự host qua `next/font`. Đổi template bằng `?t=`. Tôn trọng `prefers-reduced-motion`. Ảnh mẫu dùng ảnh free (cần chọn nguồn không yêu cầu API key); nhạc mẫu chọn bản public domain (hỏi bạn trước khi tải file về repo).

---

## 7. Lộ trình

| Phase                        | Nội dung                                                                                                                                                                                                                                                                                                       | Test / tiêu chí xong                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **0. Khởi tạo lại**          | Dọn code Vite/Hono/Cloudflare (giữ `docs/`, `.gitattributes`, `.claude/`); `create-next-app` (TS, Tailwind, ESLint, `src/`); ghim TS 6; shadcn; Prettier; `docker-compose.yml` Postgres; Drizzle + `pg`; `GET /api/health` (query `select 1`); Vitest; cập nhật `docs/PLAN.md` + README; launch config; commit | `npm run check` pass; trang chủ hiện "API ✅ / DB ✅"; tắt Docker thì health trả 503; `npm run build` thành công |
| **0b. Deploy** _(để sau)_    | GitHub, Vercel, Neon (tích hợp Vercel–Neon tự tạo DB branch cho mỗi preview), GitHub Actions chạy check                                                                                                                                                                                                        | `*.vercel.app/api/health` OK                                                                                     |
| **1. Template (mock data)**  | 3 template + bộ section, mobile-first, phong bì, nhạc, đếm ngược, sự kiện theo bên, album lightbox, .ics                                                                                                                                                                                                       | Xem bằng viewport mobile; Lighthouse mobile ≥ 85; unit test helper (ics, lọc sự kiện theo bên, format ngày)      |
| **2. Thiệp đọc từ DB**       | Schema + migration + seed; `/[slug]` đọc DB, 404 nếu chưa publish; cache + revalidate; metadata OG                                                                                                                                                                                                             | Seed 2 cặp, 2 link hiển thị đúng; test service                                                                   |
| **3. Đăng nhập + Dashboard** | Better Auth Google; wizard; sửa thông tin/sự kiện; upload Cloudinary; publish; mời đồng quản lý                                                                                                                                                                                                                | E2E Playwright; user A không sửa được thiệp user B                                                               |
| **4. Khách + link riêng**    | CRUD, import Excel, mã khách, lọc theo bên, OG có tên khách, tracking đã mở, tin nhắn mẫu                                                                                                                                                                                                                      | Import 50 khách; preview đúng tên                                                                                |
| **5. RSVP + Sổ lưu bút**     | API RSVP (upsert), lời chúc, Turnstile + honeypot + rate limit, thống kê, ẩn lời chúc, export Excel                                                                                                                                                                                                            | Gửi RSVP 2 lần chỉ ra 1 bản ghi; spam bị chặn                                                                    |
| **6. QR mừng cưới**          | Tài khoản 2 bên, VietQR theo bên, copy STK                                                                                                                                                                                                                                                                     | Quét bằng app ngân hàng thật                                                                                     |
| **7. Tuỳ biến + Landing**    | Đổi màu/font, bật/tắt section, chọn template, landing page                                                                                                                                                                                                                                                     | Đổi trong dashboard thì thiệp đổi ngay                                                                           |
| **8. Admin + hoàn thiện**    | Super admin, quota, theo dõi lỗi, backup `pg_dump` hàng tuần bằng GitHub Action                                                                                                                                                                                                                                | Backup chạy thành công                                                                                           |

---

## 8. Chi tiết Phase 0 (làm ngay sau khi duyệt)

1. **Dọn code cũ:**
   - `git rm -r` các phần Vite/Hono/Cloudflare: `apps/`, `packages/`, `functions/`, `wrangler.toml`, các tsconfig, `eslint.config.js`, `package.json`.
   - Phải dừng dev server nếu đang chạy, và hỏi bạn trước khi dừng.
2. **Scaffold:**
   - Chạy `npx create-next-app@latest` vào thư mục tạm, rồi chép sang project (giữ `docs/`, `.claude/`, `.gitattributes`, `.prettierrc.json`).
   - Hạ TypeScript về `~6.0`.
   - Cho phép script cài đặt cần thiết qua `allowScripts`.
   - Kiểm tra ngay `npm run dev` / `npm run build`: SWC là file native, cần xác nhận Windows không chặn.
3. **shadcn:** `npx shadcn@latest init -p nova`.
4. **Database:**
   - `docker-compose.yml`: Postgres 17, tạo 2 database `thiephong` + `thiephong_test`.
   - `.env.example`: `DATABASE_URL`, `DATABASE_URL_TEST`.
   - `src/server/db/index.ts`: `drizzle(new Pool(...))`, giữ một instance duy nhất khi hot reload.
   - `drizzle.config.ts`; script `db:up`, `db:generate`, `db:migrate`.
5. **API:** `src/app/api/health/route.ts` gọi `checkDatabase()` trong `src/server/services/health.ts`, trả kiểu `HealthResponse` (để ở `src/lib/types`).
6. **Trang chủ tạm:** hiển thị trạng thái hệ thống (port từ `App.tsx` cũ).
7. **Test:** Vitest gọi trực tiếp handler `GET` của route health với Postgres test, gồm case OK và case DB lỗi.
8. **Script:**
   - `dev`, `build`, `start`, `lint`, `typecheck`, `format(:check)`, `test`, `check`.
   - Cập nhật `.claude/launch.json` (`next dev`, cổng 3000).
9. **Tài liệu:** cập nhật `docs/PLAN.md` (thay bằng plan này) và README.
10. **Commit:** chỉ commit khi bạn đồng ý.

## 9. Kiểm thử chung

- `npm run check` = typecheck + lint + format + Vitest.
- Postgres local qua Docker: `npm run db:up`.
- Kiểm tra trên trình duyệt bằng preview của app (viewport mobile); Lighthouse cho trang thiệp.
- Từ Phase 3: Playwright e2e cho luồng chính.

## 10. Chi phí

**0đ**: Vercel Hobby, Neon free, Cloudinary free. Tốn tiền chỉ khi bạn tự chọn mua domain (~250k/năm).

---

## Ghi chú triển khai

- **Phase 0 (13/11/2026):**
  - Next.js 16.4 bật sẵn Cache Components.
  - Route handler đọc DB gọi `await connection()` để không bị prerender lúc build.
  - Postgres local chạy ở cổng **5434** (tránh trùng Postgres khác trên máy).
  - Test dùng `.env.test` (database `thiephong_test`), vì Next.js không đọc `.env.local` khi `NODE_ENV=test`.
- **Phase 1 (13/11/2026):**
  - 3 template (Song Hỷ, Thanh Lịch, Hoa Cỏ) chạy với dữ liệu mẫu `src/mocks/invitations.ts`.
  - Xem thử: `/demo`, `/demo/nam2027` (khách nhà trai), `/demo/cohoa27` (khách nhà gái); thêm `?t=thanh-lich` hoặc `?t=hoa-co` để đổi template.
  - Ảnh mẫu CC0 nằm trong `public/demo/` (nguồn ở `public/demo/CREDITS.md`); nhạc mẫu public domain phát từ Wikimedia.
  - Lighthouse mobile (build production, máy local): Performance 85–88, Accessibility 100, Best Practices 100. SEO 83 vì thiệp cố ý đặt `noindex`.
  - Cache Components: `params` được đọc trong `<Suspense>`, nên link sai hiện trang "Không tìm thấy thiệp" (kèm noindex) với HTTP 200 thay vì 404.
