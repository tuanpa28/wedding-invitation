# Thiệp Hồng

Thiệp cưới online cho **một đám cưới**: link chung cho mọi người và link riêng mang tên từng khách mời
(`/m/<mã-khách>`). Chạy hoàn toàn miễn phí trên Firebase gói Spark.
Kế hoạch chi tiết: [docs/PLAN.md](docs/PLAN.md).

## Công nghệ

- **Next.js 16** xuất site tĩnh (`output: 'export'`) → Firebase Hosting
- **Cloud Firestore** (dữ liệu) + **Firebase Auth** (đăng nhập quản trị bằng Google), bảo vệ bằng `firestore.rules`
- Cloudinary (ảnh/nhạc, upload thẳng từ trình duyệt), Tailwind v4, shadcn/ui
- **Motion** (hiệu ứng) + **Lenis** (cuộn mượt)
- Vitest, Firebase Emulator (test Security Rules), ESLint, Prettier

## Chạy ở máy local (không cần project Firebase)

Yêu cầu: Node.js ≥ 22, Java ≥ 11 (để chạy Firebase Emulator).

```bash
npm install
```

```bash
cp .env.example .env
```

Tạo file `.env.development.local` với một dòng `NEXT_PUBLIC_FIREBASE_EMULATOR=true`: khi chạy `npm run dev`, thiệp và trang quản lý dùng emulator thay vì project thật. Lúc build/deploy, Next.js không đọc file này.

Bật emulator (Firestore, Auth, Hosting; giao diện quản lý emulator ở http://localhost:4000). Để cửa sổ này chạy:

```bash
npm run emulators
```

Ở cửa sổ khác, ghi thiệp mẫu và khách mẫu vào emulator:

```bash
npm run seed
```

Chạy chế độ dev:

```bash
npm run dev
```

- http://localhost:3000: thiệp, link chung (sự kiện cả hai bên)
- http://localhost:3000/m/nam2027: khách nhà trai "Anh Nam"
- http://localhost:3000/m/cohoa27: khách nhà gái "Cô Hoa và gia đình"
- Thêm `?t=song-hy`, `?t=nga` hoặc `?t=hoa-co` để xem thử template khác.
- Máy tắt hiệu ứng (Windows: _Settings → Accessibility → Visual effects → Animation effects_; điện thoại: _Giảm chuyển động_) thì thiệp mở ngay, không có hiệu ứng. Thêm `?motion=full` để luôn xem hiệu ứng (khung xem trước trong `/admin` đã bật sẵn).

Muốn xem đúng như khi đã deploy (site tĩnh + rewrite của Firebase Hosting): tắt `npm run emulators`, rồi chạy `npm run preview` (build xong tự bật emulator, thiệp ở http://localhost:5005), sau đó chạy lại `npm run seed`.

> Emulator không lưu dữ liệu khi tắt. Mỗi lần bật lại thì chạy lại `npm run seed`.
> Firestore Emulator dùng cổng **8085**, Hosting dùng **5005** (cổng 8080 và 5000 hay bị Docker hoặc chương trình khác chiếm).

## Trang quản lý (`/admin`)

Đăng nhập Google bằng email nằm trong danh sách admin (`site/admins` trong Firestore). Menu xếp theo thứ tự công việc:

- **Tổng quan** (mở đầu tiên): đếm ngược tới sự kiện sắp tới, link thiệp chung, số khách · đã gửi · đã mở · sẽ đến · lời chúc, danh sách việc cần chuẩn bị (bấm để tới đúng chỗ), hoạt động gần đây, nút **Tải bản sao lưu** (file JSON chứa toàn bộ dữ liệu, cất ở nơi riêng tư).
- _Chuẩn bị thiệp_
  - **Thông tin:** tên, họ tên, thứ bậc, bố mẹ, địa chỉ hai bên; câu trích dẫn.
  - **Sự kiện:** từng bên nhà trai / nhà gái / chung. Khách chỉ thấy sự kiện của bên mình; sự kiện hiện ở link chung có nhãn riêng.
  - **Giao diện:** mẫu thiệp, ảnh bìa, album (tối đa 40 ảnh, kéo thả được, xoá có Hoàn tác), nhạc nền (tải file ≤ 8 MB hoặc dán link https). Mục này lưu ngay khi chọn.
  - **Mừng cưới:** tài khoản ngân hàng nhà trai / nhà gái → thiệp có mục mừng cưới với QR VietQR và nút chép số tài khoản. Lưu xong nên quét thử QR trong khung xem trước bằng app ngân hàng thật.
- _Gửi & theo dõi_
  - **Khách mời:** thêm từng khách hoặc nhập Excel (có file mẫu), mỗi khách một link `/m/<mã>`. Chép tin nhắn mời, chép link hoặc **Chia sẻ** (điện thoại: mở bảng chia sẻ để gửi qua Zalo, Messenger) là khách được tự đánh dấu **đã gửi**; bấm trạng thái để đánh dấu tay. Lọc chưa gửi / đã gửi chưa mở / đã mở, theo phản hồi, bên, nhóm; sắp xếp; mã QR; xuất Excel. Tin nhắn mời mẫu sửa được.
  - **Phản hồi:** bật/tắt form xác nhận tham dự và sổ lưu bút, đặt hạn xác nhận; số người sẽ đến theo từng bên, ai chưa phản hồi; lọc, tìm; ẩn/hiện/xoá lời chúc; xuất Excel cả xác nhận lẫn sổ lưu bút.
- _Cài đặt_
  - **Người quản lý:** thêm/bớt email Google được vào trang quản lý (quyền như nhau, tối đa 10 người). Không tự bỏ quyền của mình được, để luôn còn ít nhất một người quản lý.

Đổi tab không mất phần đang sửa; tab có thay đổi chưa lưu hiện chấm đỏ, **Ctrl/⌘+S** để lưu. Menu bên trái có nút mở thiệp như khách (link chung / nhà trai / nhà gái), không tính là lượt mở của khách. Khi mẫu thiệp, ảnh bìa, tên hoặc ngày cưới khác bản deploy gần nhất, trang quản lý nhắc chạy lại `npm run deploy`.

**Link chung và link riêng:** link chung (`/`) chỉ mời chung chung — một sự kiện "Chung hai bên" nếu có, không thì tiệc cưới sớm nhất. Link riêng (`/m/<mã>`) có tên khách và đủ lịch của bên khách (nhà trai hoặc nhà gái, chọn khi tạo khách). Vào `/m` không kèm mã sẽ tự về `/`.

**Khi chạy emulator:** bấm "Đăng nhập với Google", trong cửa sổ của Auth Emulator chọn _Add new account_ và nhập `admin@thiephong.test` (admin thử do `npm run seed` tạo).

**Danh sách admin:** sửa `ADMIN_EMAILS` trong `.env` rồi chạy `npm run seed -- --prod`, hoặc sửa trực tiếp document `site/admins` (field `emails`, dạng mảng) trong Firebase Console → Firestore. Sau khi đã có ít nhất một admin, thêm/bớt người ngay trong `/admin` → **Người quản lý**.

### Cloudinary (tải ảnh/nhạc)

1. Tạo tài khoản miễn phí tại [cloudinary.com](https://cloudinary.com/). _Cloud name_ nằm ở trang Dashboard.
2. **Settings → Upload → Upload presets → Add upload preset:**
   - _Signing mode_: **Unsigned**
   - _Asset folder_: `thiep-cuoi`
   - _Allowed formats_: `jpg,jpeg,png,webp,heic,avif,mp3,m4a,aac`
   - _Max file size_: `10000000` (10 MB)
   - _Incoming transformation_ (tuỳ chọn, tiết kiệm dung lượng): `c_limit,w_2400,h_2400`
3. Điền vào `.env`: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...` và `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<tên preset>`, rồi chạy lại `npm run dev` / `npm run deploy`.

> Upload preset _unsigned_ nghĩa là ai biết tên preset đều tải file lên được (site tĩnh không có server để ký). Giới hạn định dạng/dung lượng ở bước 2 giúp tránh bị lạm dụng; nếu thấy dung lượng tăng bất thường, đổi tên preset là xong.

## Các lệnh

| Lệnh                 | Tác dụng                                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Next.js dev (đọc Firestore Emulator khi `NEXT_PUBLIC_FIREBASE_EMULATOR=true`)                                          |
| `npm run emulators`  | Bật Firebase Emulator (Firestore 8085, Auth 9099, Hosting 5005, UI 4000)                                               |
| `npm run seed`       | Ghi thiệp mẫu + khách mẫu + admin thử vào emulator                                                                     |
| `npm run build`      | Xuất site tĩnh vào `out/`                                                                                              |
| `npm run preview`    | Build rồi chạy site tĩnh trên Hosting emulator                                                                         |
| `npm run deploy`     | Build rồi deploy Hosting + Firestore rules lên Firebase                                                                |
| `npm test`           | Vitest (logic thuần)                                                                                                   |
| `npm run test:rules` | Test `firestore.rules` trên Firestore Emulator (tự bật/tắt emulator)                                                   |
| `npm run check`      | typecheck + lint + format + test + test:rules (chạy trước khi commit)                                                  |
| `npm run test:e2e`   | Test trên trình duyệt Edge (máy tính + điện thoại): build, bật emulator, chạy Playwright. Tắt emulator đang chạy trước |

## Deploy lên Firebase (gói Spark, 0đ)

### 1. Tạo project (làm một lần)

1. Vào [console.firebase.google.com](https://console.firebase.google.com/) → **Create a project**, đặt tên (ví dụ `thiep-cuoi-tuan-lan`). Có thể tắt Google Analytics. Project mới mặc định ở gói **Spark** (miễn phí, không cần thẻ).
2. **Build → Firestore Database → Create database**, chọn vùng `asia-southeast1 (Singapore)`, _Start in production mode_.
3. **Build → Authentication → Get started → Sign-in method → Google → Enable** (chọn email hỗ trợ là email của bạn). Sau khi deploy, vào **Authentication → Settings → Authorized domains** kiểm tra đã có `<project-id>.web.app` (Firebase tự thêm).
4. **Project settings (bánh răng) → General → Your apps → Web (`</>`)**: đặt tên app, **không** cần tick Firebase Hosting ở bước này. Firebase hiện đoạn `firebaseConfig`.

### 2. Cấu hình project

Điền vào `.env` (lấy từ `firebaseConfig`):

```
NEXT_PUBLIC_FIREBASE_EMULATOR=false
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_SITE_URL=https://<project-id>.web.app
ADMIN_EMAILS=email-cua-ban@gmail.com,email-nguoi-kia@gmail.com
```

Đăng nhập Firebase CLI và chọn project:

```bash
npx firebase login
```

```bash
npx firebase use --add
```

(chọn project vừa tạo, đặt alias `default`). Lệnh này cập nhật `.firebaserc`.

### 3. Ghi dữ liệu ban đầu

Danh sách admin (và thiệp mẫu nếu project chưa có nội dung) được ghi bằng Admin SDK:

1. **Project settings → Service accounts → Generate new private key** → lưu file JSON vào thư mục dự án, ví dụ `service-account.json` (đã có trong `.gitignore`, **không bao giờ commit hay gửi file này cho ai**).
2. Thêm vào `.env`: `GOOGLE_APPLICATION_CREDENTIALS=service-account.json`
3. Chạy:

```bash
npm run seed -- --prod
```

### 4. Deploy (thiệp được dựng sẵn lúc build)

```bash
npm run deploy
```

Thiệp ở `https://<project-id>.web.app` (và `https://<project-id>.firebaseapp.com`). Lúc build, nội dung thiệp được đọc từ Firestore và nhúng sẵn vào HTML (link chung hiện ngay, ảnh preview khi share có tên cô dâu chú rể + ảnh bìa).

- Sửa nội dung trong `/admin`: khách thấy ngay, không bắt buộc deploy lại.
- Sau khi **đổi mẫu thiệp, ảnh bìa, tên hoặc ngày cưới**: nên chạy lại `npm run deploy` để HTML dựng sẵn và ảnh preview khớp bản mới (trang quản lý tự nhắc).
- Sửa code: chạy lại `npm run deploy`.

### 5. App Check — chống spam (tuỳ chọn)

RSVP và lời chúc ai cũng gửi được (site không có server). Để chặn bot/script gửi hàng loạt:

1. Firebase Console → **App Check** → **Apps** → chọn web app → **reCAPTCHA v3** → làm theo hướng dẫn tạo khoá (trang reCAPTCHA của Google), dán _secret key_ vào Firebase.
2. Dán _site key_ vào `.env`: `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...` rồi `npm run deploy`.
3. Đợi 1–2 ngày xem tab **Metrics** của App Check thấy request hợp lệ, rồi bấm **Enforce** cho Cloud Firestore.

> Khi đã Enforce, mọi request Firestore phải có token App Check (trang quản lý và thiệp đều tự gắn). Lệnh `npm run seed -- --prod` dùng Admin SDK nên không bị ảnh hưởng.

## Cấu trúc

```
src/
  app/                 page.tsx (link chung), m/page.tsx (link khách), admin/page.tsx (quản lý), not-found.tsx (404)
  components/admin     Trang quản lý: đăng nhập, tổng quan, các form, khách mời, phản hồi
  components/invitation  Phần dùng chung của thiệp + InvitationApp (đọc Firestore, chọn template)
  lib/firebase/        Khởi tạo Firebase; public-data (Firestore Lite cho khách), admin-client (Auth + Firestore cho admin)
  lib/validators/      Kiểm tra dữ liệu form (zod)
  lib/invitation/      Kiểu dữ liệu, lọc sự kiện theo bên, lịch, đếm ngược
  templates/           song-hy, nga, hoa-co
  mocks/               Thiệp mẫu (seed + test)
scripts/seed.mts       Ghi dữ liệu bằng Admin SDK (emulator hoặc project thật)
firestore.rules        Quyền truy cập dữ liệu
firebase.json          Hosting (rewrite /m/** → /m.html), emulator
tests/                 Vitest; tests/rules: test Security Rules
```

## Ghi chú

- **TypeScript được ghim ở bản 6:** typescript-eslint chưa hỗ trợ TS 7.
- **Không dùng oxlint/Biome:** chính sách Application Control của Windows chặn file native của oxlint.
- **npm 11 chặn script cài đặt mặc định.** Danh sách cho phép/từ chối nằm trong `allowScripts` của `package.json` (`@firebase/util`, `protobufjs`, `re2` không cần chạy script).
