# Plan: Thiệp Hồng — Nền tảng thiệp cưới online (miễn phí)

> Bản 2 (13/11/2026): chuyển toàn bộ sang Cloudflare, bỏ gửi email, không thu phí.

## Context

Nền tảng thiệp cưới cho **nhiều cặp đôi**: mỗi cặp đăng ký, tự tạo thiệp, có một link riêng; mỗi khách mời có link mang tên mình. Đám cưới kiểu Việt Nam: **2 bên nhà trai / nhà gái**, lễ và tiệc tổ chức riêng. Tính năng: RSVP + lời chúc, link riêng cho từng khách, trang quản lý, QR mừng cưới.
Ràng buộc: **0đ**, **không thu phí**, **không gửi email**, làm **từng phase**: phase nào test ổn mới qua phase tiếp.

- **Tên thương hiệu:** **Thiệp Hồng**. Lấy từ cách nói "gửi thiệp hồng" quen thuộc. Domain free: `thiephong.pages.dev` (nếu tên đã bị lấy thì dùng `thiephong-vn`).
- **Folder:** `D:\WorkSpace\wedding-invitation` (package name `thiep-hong`).

---

## 1. Công nghệ — toàn bộ trên Cloudflare

| Thành phần     | Chọn                                                                                                                        | Free tier                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Frontend       | **React 19 + Vite + TypeScript**, Tailwind v4, shadcn/ui (dashboard), Motion (hiệu ứng thiệp), React Router, TanStack Query | Host trên **Cloudflare Pages**: không giới hạn băng thông và request file tĩnh                                                    |
| Backend API    | **Hono** chạy trên **Pages Functions** (bản chất là Cloudflare Workers)                                                     | 100.000 request/ngày, 10ms CPU/request                                                                                            |
| Database       | **Cloudflare D1** (SQLite) + **Drizzle ORM**                                                                                | 500 MB/DB, 5 triệu lượt đọc dòng + 100k lượt ghi dòng/ngày, khôi phục về bất kỳ thời điểm nào trong 7 ngày gần nhất (Time Travel) |
| Lưu ảnh / nhạc | **Cloudflare R2**                                                                                                           | 10 GB, **không tính phí băng thông** (~700 thiệp × 30 ảnh)                                                                        |
| Đăng nhập      | **Google login** (OAuth, thư viện `arctic`), session lưu trong D1                                                           | free, không cần email                                                                                                             |
| Chống spam     | Honeypot + **Cloudflare Turnstile** + giới hạn số lần gửi theo IP                                                           | free                                                                                                                              |
| QR mừng cưới   | **VietQR** (`img.vietqr.io`)                                                                                                | free, không cần key                                                                                                               |
| Excel          | SheetJS, xử lý ngay trên trình duyệt (không tốn CPU server)                                                                 | —                                                                                                                                 |
| Source / CI    | GitHub + GitHub Actions (test + deploy + chạy migration D1)                                                                 | free                                                                                                                              |
| Test           | Vitest (+ `@cloudflare/vitest-pool-workers` để test API với D1 thật ở local), Playwright e2e                                | —                                                                                                                                 |

- **Công cụ dev (cập nhật Phase 0a):** TypeScript 6 + ESLint + Prettier. TS 7 chưa được typescript-eslint hỗ trợ; oxlint bị Windows Application Control chặn.

**Vì sao không chạy Next.js trên Cloudflare?** Gói free của Workers giới hạn 10ms CPU mỗi request và bundle tối đa 3 MB. Next.js render phía server rất dễ vượt cả hai mức này. SPA React + Hono rất nhẹ, nằm gọn trong quota.

**Vì sao API chạy trong Pages Functions mà không tách thành Worker riêng?** Để frontend và `/api` dùng **chung domain**. Nếu tách sang `*.workers.dev`, cookie đăng nhập trở thành cookie bên thứ ba và bị Safari/iPhone chặn. Pages Functions vẫn là Workers, quota y như nhau.

---

## 2. Kiến trúc

```
Khách (điện thoại, mở link từ Zalo/Messenger)
        │
        ▼
Cloudflare Pages — thiephong.pages.dev
  ├─ file tĩnh (React SPA)            → free, không tính quota
  ├─ Pages Function: /:slug, /:slug/:code
  │     chèn <title>/og:* (tên khách, ảnh bìa) + nhúng sẵn dữ liệu thiệp vào HTML
  └─ Pages Function: /api/*  (Hono)
        │                 │
        ▼                 ▼
   D1 (SQLite)       R2 (ảnh, nhạc) ── link public r2.dev
```

- **Định tuyến nhiều cặp đôi theo path:** `/tuan-lan` là thiệp chung, `/tuan-lan/a8Kx2pQe` là thiệp riêng của một khách. Các slug hệ thống như `api`, `dashboard`, `login`, `admin`, `assets` được giữ lại, cặp đôi không dùng được.
- **Preview khi chia sẻ qua Zalo/Facebook:** bot của Zalo/Facebook không chạy JS, nên Pages Function chèn sẵn meta tag phía server: `og:title` = "Kính mời anh Nam — Lễ cưới Tuấn & Lan", `og:image` = ảnh bìa. Không tự vẽ ảnh OG để khỏi tốn CPU.
- **Template là component React trong code.** Thiệp = template + dữ liệu D1 + theme (màu, font, bật/tắt section).
- **Ảnh:** trình duyệt nén sang WebP (bản lớn 1920px + thumbnail 480px) rồi mới upload qua `/api` vào R2, nên server không phải xử lý ảnh.
- **Lưu ý r2.dev:** link public r2.dev bị giới hạn tốc độ và Cloudflare không khuyến nghị dùng cho production. Với vài chục cặp đôi thì vẫn ổn. Sau này nếu mua domain (~250k/năm) thì gắn domain riêng cho R2 để có CDN cache; code chỉ đổi biến `ASSET_BASE_URL`.

---

## 3. Luồng hoạt động

**Cặp đôi:**

1. Đăng nhập Google, đi qua wizard: tên cô dâu/chú rể, bố mẹ 2 bên, slug, chọn template.
2. Nhập sự kiện: Ăn hỏi, Lễ Vu Quy (nhà gái), Lễ Thành Hôn (nhà trai), Tiệc cưới mỗi bên. Mỗi sự kiện có giờ, địa chỉ, link Google Maps.
3. Upload ảnh, viết chuyện tình yêu, upload nhạc nền, nhập tài khoản ngân hàng 2 bên.
4. Thêm khách (nhập tay hoặc import Excel). Mỗi khách có **bên** (trai/gái), **xưng hô** và mã link riêng.
5. Xem trước, Publish, rồi copy link hoặc tin nhắn mẫu gửi Zalo cho từng khách.
6. Theo dõi: ai đã mở thiệp, ai RSVP, bao nhiêu người đến, ẩn lời chúc, export Excel.
7. Cô dâu và chú rể có thể cùng quản lý một thiệp: người tạo gửi link mời, người kia đăng nhập Google để nhận quyền.

**Khách mời:**

1. Mở link riêng, thấy phong bì "Kính mời anh Nam", bấm mở thì nhạc phát (trình duyệt chặn tự phát nhạc nên cần một cú bấm).
2. Chỉ thấy sự kiện **của bên mình** cộng các sự kiện chung. Có đếm ngược, album, bản đồ, nút "Thêm vào lịch" (.ics).
3. Gửi RSVP (sửa lại được) và lời chúc vào sổ lưu bút.
4. Mừng cưới: QR VietQR của bên tương ứng và nút copy số tài khoản.

- Lượt "đã mở" được ghi bằng JS phía client, nên bot Zalo tạo preview không bị tính.

---

## 4. Database (Drizzle + D1)

- `users` — id, google_id, email, name, avatar, role (user/superadmin)
- `sessions` — id (token hash), user_id, expires_at
- `weddings` — id, slug (unique), bride_name, groom_name, bride_parents, groom_parents, love_story, template_id, theme (json), music_key, cover_key, status (draft/published/locked), settings (json), created_at
- `wedding_members` — wedding_id, user_id, role (owner/editor); `wedding_invites` — mã mời đồng quản lý
- `events` — wedding_id, side (bride/groom/both), type, title, start_at, venue, address, map_url, sort
- `guests` — wedding_id, side, name, salutation, display_name, code (8 ký tự, unique), group_tag, phone, max_attendees, first_opened_at, open_count
- `rsvps` — wedding_id, guest_id (nullable), name, side, attending (yes/no/maybe), attendees_count, note, updated_at
- `wishes` — wedding_id, guest_id (nullable), name, message, status (visible/hidden), created_at
- `bank_accounts` — wedding_id, side, bank_bin, account_no, account_name
- `photos` — wedding_id, key, thumb_key, width, height, kind (cover/gallery/story), sort

Mọi API dashboard đều kiểm tra quyền qua `wedding_members` (middleware `requireWeddingAccess`).
Giới hạn mỗi thiệp: tối đa 40 ảnh, 1 file nhạc ≤ 8 MB, 1.000 khách.

---

## 5. Cấu trúc thư mục

```
wedding-invitation/
  src/                      # React SPA
    routes/                 # landing, login, dashboard/*, admin/*, invitation
    templates/
      sections/             # Cover, Couple, Countdown, Events, Story, Album, Rsvp, Guestbook, Gift
      song-hy/  thanh-lich/  hoa-co/
    components/ui/          # shadcn
    lib/                    # api client, nén ảnh, ics, vietqr, excel
  functions/                # Cloudflare Pages Functions
    api/[[route]].ts        # mount Hono app
    _middleware.ts          # chèn meta cho route thiệp
  server/                   # Hono routes, services, auth, db/schema.ts
  shared/                   # zod schema + types dùng chung FE/BE
  migrations/               # D1 migrations (drizzle-kit)
  tests/  e2e/
  wrangler.toml
  docs/PLAN.md
```

---

## 6. Template (bản đầu, sẽ chỉnh sau)

1. **Song Hỷ** — truyền thống: đỏ son + vàng kim, chữ Hỷ, hoa văn, font serif trang trọng.
2. **Thanh Lịch** — hiện đại tối giản: trắng kem, đen than, nhiều khoảng trắng, typography lớn.
3. **Hoa Cỏ** — pastel hồng/xanh lá, hoạ tiết hoa vẽ tay (SVG), nhẹ nhàng.

Ba template dùng chung bộ section. Mỗi template chỉ đổi layout, màu, font và hoạ tiết. Ảnh mẫu tạm dùng ảnh free (Unsplash), nhạc mẫu chọn bản không bản quyền.

---

## 7. Lộ trình — mỗi phase test ổn mới qua phase tiếp

| Phase                           | Nội dung                                                                                                                                | Test / tiêu chí xong                                                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **0a. Khởi tạo local**          | git init, Vite + React + TS + Tailwind + shadcn, Hono trong Pages Functions, D1 local + Drizzle, `/api/health`, ESLint/Prettier, Vitest | `wrangler pages dev` chạy được ở local (**chưa cần tài khoản Cloudflare**); `/api/health` query được D1 local; lint + test pass |
| **0b. Deploy**                  | Hướng dẫn bạn tạo GitHub + Cloudflare; tạo D1/R2 thật; GitHub Actions: lint → test → migrate → deploy                                   | Mở được `thiephong.pages.dev`, `/api/health` OK trên production                                                                 |
| **1. Template (mock data)**     | Bộ section + 3 template, mobile-first, phong bì mở thiệp, nhạc, đếm ngược, album lightbox, map, .ics                                    | Xem trên điện thoại thật, Lighthouse mobile ≥ 85; chuyển template bằng query `?t=`                                              |
| **2. Thiệp đọc từ D1**          | Schema + seed; `/:slug` đọc D1, 404 nếu chưa publish; middleware chèn meta + nhúng dữ liệu                                              | Seed 2 cặp → 2 link hiển thị đúng; sửa DB thì thấy đổi; share link lên Zalo thấy preview đúng                                   |
| **3. Đăng nhập + Dashboard**    | Google login, wizard, sửa thông tin/sự kiện, upload ảnh/nhạc R2, preview, publish, mời đồng quản lý                                     | E2E: login → tạo → upload → publish → mở link; user A **không** sửa được thiệp user B                                           |
| **4. Khách + link riêng**       | CRUD khách, import Excel, sinh mã, lọc sự kiện theo bên, meta có tên khách, tracking đã mở, copy tin nhắn mẫu                           | Import 50 khách; khách nhà gái chỉ thấy sự kiện nhà gái; dashboard cập nhật "đã mở"                                             |
| **5. RSVP + Sổ lưu bút**        | Form RSVP (upsert), lời chúc, Turnstile + honeypot + giới hạn theo IP, thống kê theo bên, ẩn lời chúc, export Excel                     | Gửi RSVP 2 lần chỉ ra 1 bản ghi; spam bị chặn; file Excel đúng                                                                  |
| **6. QR mừng cưới**             | Tài khoản 2 bên, VietQR theo bên của khách, copy STK                                                                                    | Quét bằng app ngân hàng thật ra đúng tên, STK, nội dung                                                                         |
| **7. Tuỳ biến + Landing**       | Đổi màu/font, bật/tắt section, chọn template trong dashboard, landing page Thiệp Hồng                                                   | Đổi trong dashboard thì thiệp đổi ngay                                                                                          |
| **8. Super admin + hoàn thiện** | Trang admin xem/khoá thiệp, kiểm tra quota, backup D1 hàng tuần (`wrangler d1 export` qua GitHub Action), theo dõi lỗi                  | Vượt giới hạn thì có thông báo; backup chạy thành công                                                                          |

Mỗi phase làm trên 1 nhánh. Cloudflare Pages tạo link preview `<nhánh>.thiephong.pages.dev` (dùng DB preview riêng). Bạn test xong thì merge lên `main`, production tự deploy.

---

## 8. Kiểm thử

- **Local:** `npm run dev` (Vite) + `wrangler pages dev` với D1/R2 giả lập. Không cần internet hay tài khoản.
- **Unit/API (Vitest):** sinh mã khách, lọc sự kiện theo bên, URL VietQR, file .ics, validate zod, phân quyền, chạy API trên D1 local.
- **E2E (Playwright, viewport mobile):** tạo thiệp → thêm khách → mở link khách → RSVP → xem trên dashboard.
- **Thủ công:** iPhone/Android thật, share link qua Zalo/Messenger.
- **CI:** GitHub Actions chạy lint + typecheck + test cho mỗi PR.

---

## 9. Chi phí

**0đ.** Tốn tiền chỉ khi bạn tự chọn mua domain (~250k/năm). Nếu một ngày vượt 100k request API thì request vượt bị từ chối chứ **không bị tính tiền** (gói free không gắn thẻ).

---

## 10. Việc của bạn

- Phase 0b: tạo tài khoản **GitHub**, **Cloudflare**, **Google Cloud** (OAuth client, ở Phase 3) và **Turnstile** (Phase 5). Mình sẽ hướng dẫn từng bước khi đến phase đó.
- Sau Phase 1: xem 3 template rồi góp ý chỉnh.
