# Thiệp Hồng

Thiệp cưới online cho **một đám cưới**: link chung cho mọi người và link riêng mang tên từng khách mời
(`/m/<mã-khách>`). Chạy hoàn toàn miễn phí trên Firebase gói Spark.
Kế hoạch chi tiết: [docs/PLAN.md](docs/PLAN.md).

## Công nghệ

- **Next.js 16** xuất site tĩnh (`output: 'export'`) → Firebase Hosting
- **Cloud Firestore** (dữ liệu) + **Firebase Auth** (đăng nhập quản trị bằng Google), bảo vệ bằng `firestore.rules`
- Cloudinary (ảnh/nhạc, từ Phase B), Tailwind v4, shadcn/ui, Motion (từ Phase C)
- Vitest, Firebase Emulator (test Security Rules), ESLint, Prettier

## Chạy ở máy local (không cần project Firebase)

Yêu cầu: Node.js ≥ 22, Java ≥ 11 (để chạy Firebase Emulator).

```bash
npm install
```

```bash
cp .env.example .env.local
```

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
- Thêm `?t=song-hy`, `?t=thanh-lich` hoặc `?t=hoa-co` để xem thử template khác.

Muốn xem đúng như khi đã deploy (site tĩnh + rewrite của Firebase Hosting): tắt `npm run emulators`, rồi chạy `npm run preview` (build xong tự bật emulator, thiệp ở http://localhost:5005), sau đó chạy lại `npm run seed`.

> Emulator không lưu dữ liệu khi tắt. Mỗi lần bật lại thì chạy lại `npm run seed`.
> Firestore Emulator dùng cổng **8085**, Hosting dùng **5005** (cổng 8080 và 5000 hay bị Docker hoặc chương trình khác chiếm).

## Các lệnh

| Lệnh                 | Tác dụng                                                                      |
| -------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`        | Next.js dev (đọc Firestore Emulator khi `NEXT_PUBLIC_FIREBASE_EMULATOR=true`) |
| `npm run emulators`  | Bật Firebase Emulator (Firestore 8085, Auth 9099, Hosting 5005, UI 4000)      |
| `npm run seed`       | Ghi thiệp mẫu + khách mẫu + admin thử vào emulator                            |
| `npm run build`      | Xuất site tĩnh vào `out/`                                                     |
| `npm run preview`    | Build rồi chạy site tĩnh trên Hosting emulator                                |
| `npm run deploy`     | Build rồi deploy Hosting + Firestore rules lên Firebase                       |
| `npm test`           | Vitest (logic thuần)                                                          |
| `npm run test:rules` | Test `firestore.rules` trên Firestore Emulator (tự bật/tắt emulator)          |
| `npm run check`      | typecheck + lint + format + test + test:rules (chạy trước khi commit)         |

## Deploy lên Firebase (gói Spark, 0đ)

### 1. Tạo project (làm một lần)

1. Vào [console.firebase.google.com](https://console.firebase.google.com/) → **Create a project**, đặt tên (ví dụ `thiep-cuoi-tuan-lan`). Có thể tắt Google Analytics. Project mới mặc định ở gói **Spark** (miễn phí, không cần thẻ).
2. **Build → Firestore Database → Create database**, chọn vùng `asia-southeast1 (Singapore)`, _Start in production mode_.
3. **Build → Authentication → Get started → Sign-in method → Google → Enable** (chọn email hỗ trợ là email của bạn). Dùng từ Phase B.
4. **Project settings (bánh răng) → General → Your apps → Web (`</>`)**: đặt tên app, **không** cần tick Firebase Hosting ở bước này. Firebase hiện đoạn `firebaseConfig`.

### 2. Cấu hình project

Điền vào `.env.local` (lấy từ `firebaseConfig`):

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
2. Thêm vào `.env.local`: `GOOGLE_APPLICATION_CREDENTIALS=service-account.json`
3. Chạy:

```bash
npm run seed -- --prod
```

### 4. Deploy

```bash
npm run deploy
```

Thiệp ở `https://<project-id>.web.app` (và `https://<project-id>.firebaseapp.com`). Mỗi lần sửa code thì chạy lại `npm run deploy`. Nội dung thiệp sửa trong trang quản lý (Phase B) thì không cần deploy lại.

> Khi deploy xong, đặt lại `NEXT_PUBLIC_FIREBASE_EMULATOR=true` nếu muốn tiếp tục làm việc với emulator ở máy.

## Cấu trúc

```
src/
  app/                 page.tsx (link chung), m/page.tsx (link khách), not-found.tsx (404)
  components/invitation  Phần dùng chung của thiệp + InvitationApp (đọc Firestore, chọn template)
  lib/firebase/        Khởi tạo Firebase, đọc dữ liệu thiệp (Firestore Lite)
  lib/invitation/      Kiểu dữ liệu, lọc sự kiện theo bên, lịch, đếm ngược
  templates/           song-hy, thanh-lich, hoa-co
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
