# Kế hoạch v4: Thiệp Hồng — một đám cưới, Next.js tĩnh + Firebase (gói Spark, 0đ)

> Bản v3 (nhiều cặp đôi, Postgres, Vercel) nằm trong lịch sử git (commit `105f9f0`). v4 đổi hướng theo yêu cầu ngày 19/11/2026.

## 1. Yêu cầu

- **Chỉ một đám cưới.** Nhà trai và nhà gái tổ chức lễ riêng.
- **Trang quản lý:** sửa nội dung thiệp, chọn/đổi template bất cứ lúc nào, tạo link riêng cho từng khách.
- **Trang thiệp cho từng khách:** có tên khách, chỉ hiện sự kiện của bên khách.
- **3 template có animation hiện đại:** giữ Song Hỷ / Thanh Lịch / Hoa Cỏ và nâng cấp hiệu ứng.
- **Chức năng thêm:** RSVP, sổ lưu bút realtime, QR mừng cưới, theo dõi khách đã mở thiệp.
- **Deploy:** Firebase gói **Spark** (miễn phí, không cần thẻ). Ảnh và nhạc lưu trên **Cloudinary** free.

## 2. Công nghệ

| Phần       | Chọn                                                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| Framework  | **Next.js 16** xuất trang tĩnh (`output: 'export'`), React 19, TypeScript                                               |
| Giao diện  | Tailwind v4, shadcn/ui (trang quản lý)                                                                                  |
| Animation  | **Motion** (`motion/react`): mở thiệp, chữ hiện dần, parallax. **Lenis** cho cuộn mượt.                                 |
| Dữ liệu    | **Cloud Firestore**, gọi thẳng từ trình duyệt bằng Firebase JS SDK, bảo vệ bằng Security Rules                          |
| Đăng nhập  | **Firebase Auth** (Google), chỉ các email trong danh sách quản trị                                                      |
| Ảnh / nhạc | **Cloudinary**: upload preset _unsigned_ giới hạn thư mục/định dạng, ảnh resize qua URL                                 |
| Form       | react-hook-form + zod                                                                                                   |
| Excel      | `read-excel-file` / `write-excel-file` (nhẹ)                                                                            |
| QR         | `qrcode` (QR link khách), VietQR `img.vietqr.io` (QR mừng cưới)                                                         |
| Hosting    | **Firebase Hosting** (CDN, HTTPS, tên miền `*.web.app`)                                                                 |
| Test       | Vitest (logic), **Firebase Emulator** + `@firebase/rules-unit-testing` (Security Rules), Playwright (E2E trên emulator) |

**Vì sao xuất trang tĩnh:** gói Spark không có Cloud Functions/App Hosting nên không chạy được Next.js phía server. Mọi trang là HTML/JS tĩnh; dữ liệu đọc/ghi Firestore từ trình duyệt.

**Hệ quả:**

- Ảnh preview khi gửi link qua Zalo/Messenger là ảnh chung của thiệp, không có tên từng khách.
- Không có API riêng. Mọi quyền nằm trong `firestore.rules` và được test bằng emulator.

## 3. Đường dẫn

| URL             | Trang                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| `/`             | Thiệp, link chung: hiện sự kiện cả hai bên                                                |
| `/m/<mã-khách>` | Thiệp riêng của khách. Firebase Hosting rewrite `/m/**` → `/m.html`, trang đọc mã từ URL. |
| `/admin`        | Trang quản lý (đăng nhập Google)                                                          |

## 4. Dữ liệu Firestore

Thiết kế để **mỗi lượt mở thiệp chỉ tốn 1–2 lượt đọc** (free: 50.000 đọc / 20.000 ghi mỗi ngày).

| Document / Collection | Nội dung                                                                                                                          | Quyền                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `site/wedding`        | Toàn bộ nội dung thiệp: cô dâu/chú rể, bố mẹ, sự kiện, chuyện tình, album, nhạc, template đang dùng, tài khoản mừng cưới, cài đặt | Ai cũng đọc; chỉ admin ghi                                                                                            |
| `site/admins`         | `{ emails: [...] }`                                                                                                               | Chỉ admin đọc; sửa tay trong Firebase Console                                                                         |
| `guests/{code}`       | Tên gọi, bên (trai/gái), nhóm, số người tối đa, `openedAt`, `openCount`                                                           | Khách **get** đúng mã của mình (không liệt kê được); khách chỉ được tăng `openCount`/đặt `openedAt`; admin toàn quyền |
| `rsvps/{id}`          | Mã khách (nếu có), tên, có đến không, số người, ghi chú, thời gian                                                                | Ai cũng tạo/sửa đúng định dạng; chỉ admin đọc                                                                         |
| `wishes/{id}`         | Tên, lời chúc, bên, thời gian, `hidden`                                                                                           | Ai cũng tạo đúng định dạng; đọc lời chúc không bị ẩn; admin ẩn/xoá                                                    |

**Chống spam (không có server):**

- Rules giới hạn độ dài và kiểu dữ liệu.
- Mỗi mã khách chỉ có một RSVP (id = mã khách).
- Honeypot.
- Có thể bật thêm **App Check + reCAPTCHA v3** (miễn phí) ở bước hoàn thiện.

## 5. Chức năng

**Trang thiệp (khách):**

- Phong bì "Kính mời {tên khách}", mở thiệp có hiệu ứng, nhạc nền.
- Đếm ngược, thông tin hai bên gia đình.
- Sự kiện theo bên khách, chỉ đường Google Maps, lưu vào lịch (Apple/Google).
- Chuyện tình, album có lightbox.
- RSVP, sổ lưu bút cập nhật realtime, QR mừng cưới theo bên.
- Tôn trọng `prefers-reduced-motion`.

**Trang quản lý:**

- **Đăng nhập Google:** chỉ email trong `site/admins`.
- **Nội dung:** thông tin cô dâu/chú rể/bố mẹ, sự kiện, chuyện tình, ảnh bìa, album, nhạc (upload Cloudinary).
- **Template:** đổi bất cứ lúc nào, xem trước trong khung điện thoại.
- **Khách mời:**
  - Thêm/sửa/xoá, import Excel.
  - Mã link tự sinh, QR của link.
  - Nút chép tin nhắn mời mẫu để gửi Zalo.
  - Lọc theo bên/nhóm/đã mở/đã RSVP.
- **RSVP:** thống kê số khách đến theo bên, xuất Excel.
- **Sổ lưu bút:** ẩn/xoá lời chúc.
- **Mừng cưới:** tài khoản ngân hàng nhà trai / nhà gái.

## 6. Lộ trình

Mỗi phase test xong và chạy ổn mới sang phase tiếp theo.

| Phase                         | Nội dung                                                                                                                                                                                                                     | Tiêu chí xong                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **A. Nền móng + deploy**      | Bỏ Postgres/Drizzle/Better Auth/API. Next.js static export, Firebase SDK, `firebase.json`, `firestore.rules`, emulator, script seed. Thiệp `/` và `/m/<mã>` đọc Firestore. Hướng dẫn tạo project Firebase và deploy lần đầu. | `npm run check` pass; test rules trên emulator; thiệp mẫu chạy trên `*.web.app`              |
| **B. Trang quản lý nội dung** | Đăng nhập Google + danh sách admin; sửa thông tin/sự kiện/chuyện tình; upload Cloudinary; đổi template + xem trước                                                                                                           | Sửa trong admin thì thiệp đổi ngay; email ngoài danh sách bị từ chối (test rules)            |
| **C. Nâng cấp animation**     | Motion + Lenis cho 3 template: mở thiệp kiểu điện ảnh, chữ hiện dần, parallax, cánh hoa/hiệu ứng riêng mỗi mẫu                                                                                                               | Mượt trên điện thoại tầm trung; Lighthouse mobile ≥ 85; giảm hiệu ứng khi bật reduced-motion |
| **D. Khách mời**              | Quản lý khách, import Excel, link `/m/<mã>`, QR, tin nhắn mẫu, theo dõi đã mở                                                                                                                                                | Import 50 khách; mở link thì admin thấy "đã mở"; mã sai báo không tìm thấy                   |
| **E. RSVP + sổ lưu bút**      | Form RSVP, lời chúc realtime, thống kê, ẩn lời chúc, xuất Excel                                                                                                                                                              | Gửi RSVP 2 lần chỉ ra 1 bản ghi; lời chúc hiện ngay ở máy khác; dữ liệu sai bị rules chặn    |
| **F. Mừng cưới + hoàn thiện** | QR VietQR theo bên, App Check (tuỳ chọn), tối ưu, ảnh preview chung khi share                                                                                                                                                | Quét QR bằng app ngân hàng thật; Lighthouse ổn                                               |

## 7. Hạn mức miễn phí cần để ý

| Dịch vụ          | Free                                 | Ước tính cho một đám cưới                                                             |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| Firestore        | 1 GiB, 50k đọc + 20k ghi / ngày      | Mỗi lượt mở ≈ 2–3 đọc (+ lời chúc) → hàng nghìn lượt/ngày vẫn đủ                      |
| Firebase Hosting | 10 GB lưu trữ, **360 MB tải / ngày** | JS + font ≈ 300–500 KB/lượt → ~700+ lượt/ngày; ảnh nằm trên Cloudinary nên không tính |
| Firebase Auth    | Google sign-in miễn phí              | Chỉ 1–3 người quản trị                                                                |
| Cloudinary       | 25 credits/tháng                     | ~40 ảnh + 1 bài nhạc, ảnh được resize theo màn hình                                   |

## 8. Ghi chú triển khai

- **Phase A (19/11/2026):**
  - Đã bỏ Postgres/Drizzle/Better Auth/API route/dashboard cũ (còn trong git tại `105f9f0`). Giữ 3 template, các phần chung của thiệp, helper.
  - Next.js `output: 'export'` → `out/`. `InvitationApp` đọc `site/wedding` (+ `guests/{code}`) bằng **Firestore Lite** ở trình duyệt rồi render template; `?t=` đổi template.
  - Link khách `/m/<mã>`: Firebase Hosting rewrite `/m/**` → `/m.html`; khi chạy `next dev` thì rewrite nằm trong `next.config.ts`. Mã sai hiện "Không tìm thấy thiệp"; đường dẫn lạ trả 404 thật (`out/404.html`).
  - Mở thiệp: tăng `openCount`, ghi `firstOpenedAt`/`lastOpenedAt` (giờ server); rules chỉ cho đúng thao tác này. Mỗi phiên trình duyệt ghi một lần. `?preview` không tính.
  - Ảnh: loader chung `src/lib/image-loader.ts` (Cloudinary resize theo URL, ảnh trong `public/` giữ nguyên) vì site tĩnh không có server tối ưu ảnh.
  - Emulator: Firestore **8085**, Hosting **5005**, Auth 9099, UI 4000 (8080 bị Docker chiếm trên máy dev). Project emulator: `demo-thiephong`.
  - Test: 22 test logic + 9 test Security Rules trên emulator (`npm run test:rules`): khách không liệt kê/sửa được khách khác, không gian lận số lần mở, email chưa xác minh không phải admin, collection lạ bị chặn.
- **Phase B (19/11/2026):**
  - `/admin`: Firebase Auth (Google). Sau khi đăng nhập, đọc thử `site/admins` — chỉ admin đọc được (rules) — để biết tài khoản có quyền. Popup bị chặn (trình duyệt trong app Zalo/Messenger) thì chuyển sang đăng nhập redirect.
  - Tab: Mẫu thiệp (bấm là lưu), Thông tin, Sự kiện, Ảnh & nhạc, Chuyện tình. Mỗi tab ghi đè field cấp một của `site/wedding` (`updateDoc`); `null` → `deleteField()`; project mới thì lần lưu đầu `setDoc` cả document.
  - Khung điện thoại xem trước: iframe `/?preview&side=groom|bride` (không tính lượt mở).
  - Cloudinary upload preset **unsigned** (site tĩnh không có server ký); giới hạn định dạng/dung lượng đặt trong preset.
  - `firestore.rules` kiểm tra khung `site/wedding` (templateId hợp lệ, groom/bride là map, ≤ 12 sự kiện, ≤ 10 chuyện tình, ≤ 40 ảnh), không cho xoá document.
  - Emulator: `window.__thiephongTestSignIn(email)` đăng nhập bằng token Google giả (chỉ Auth Emulator nhận) để test trên trình duyệt / E2E.
  - Test: 29 test logic (thêm validator form), 11 test rules. Đã thử trên trình duyệt: email ngoài danh sách bị từ chối; đổi mẫu, sửa câu trích dẫn, sửa sự kiện → trang khách đổi ngay.
- **Phase C (19/11/2026):**
  - Bộ hiệu ứng chung `src/components/invitation/motion.tsx` (Motion qua `LazyMotion` + `m`, tính năng tải sau): `Reveal`/`RevealItem` (rise, fade, zoom, left, right, blur), `HeroItem` (chạy khi mở thiệp), `AnimatedText` (từng ký tự — tách theo grapheme để giữ dấu tiếng Việt — hoặc quét như viết tay), `MaskLine`, `ParallaxImage`, `CurtainReveal`, `GrowLine`, `FallingParticles` (CSS keyframes `th-fall`, nhẹ máy). Lenis cuộn mượt, chỉ tải sau khi mở thiệp. Số đếm ngược lật (AnimatePresence). Template tải lười (`React.lazy`), chỉ tải code + font của mẫu đang dùng.
  - **Song Hỷ:** cổng xoay mở 3D quanh bản lề, ánh vàng loé rồi tắt dần, quầng sáng "thở" quanh con dấu, tên hiện từng chữ, ảnh vòm parallax + thu phóng chậm, kim tuyến vàng + cánh hoa đỏ rơi.
  - **Thanh Lịch:** chữ trồi lên sau mặt nạ, ảnh mở như rèm + parallax, đường kẻ tự kéo dài, không có hạt rơi (giữ tối giản).
  - **Hoa Cỏ:** phong bì bồng bềnh, vạt lật rồi tấm thiệp trượt ra, tên hiện như viết tay, ảnh oval parallax, cánh hoa + lá bay.
  - **Giảm chuyển động:** theo hệ điều hành (`MotionConfig reducedMotion="user"`, variant `motion-reduce`) → mở ngay, không hạt rơi, không cuộn mượt. `?motion=full` bỏ qua cài đặt này (variant `motion-reduce` được định nghĩa lại để bỏ qua phần tử trong `[data-motion=full]`); khung xem trước của trang quản lý luôn dùng `?motion=full`.
  - **Lighthouse mobile** (build production trên Hosting emulator, dữ liệu mẫu): Accessibility 100, Best Practices 100, **Performance 69–71** (LCP ~7 s mô phỏng). Chưa đạt mục tiêu 85: không phải do animation (TBT 260–320 ms) mà do site tĩnh phải tải JS → đọc Firestore → tải template rồi mới vẽ được thiệp; đo không giới hạn mạng thì mọi request xong trong ~0,7 s. Hướng xử lý (Phase F): nhúng sẵn nội dung thiệp vào HTML lúc build để vẽ ngay, trình duyệt vẫn đọc Firestore để cập nhật.
  - Sửa: `eslint-config-next` bị xoá nhầm khỏi `package.json` ở Phase A (lint vẫn chạy nhờ còn trong `node_modules`) → đã cài lại.
