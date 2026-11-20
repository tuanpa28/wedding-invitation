// Xoá cache fetch của Next.js trước mỗi lần build.
// Lúc build, trang thiệp đọc nội dung từ Firestore để nhúng sẵn vào HTML. Next.js lưu kết quả
// fetch vào .next/cache/fetch-cache và dùng lại ở lần build sau, nên thiệp bị nhúng dữ liệu cũ
// (ví dụ vẫn là tên cũ dù Firestore đã đổi). Xoá đi để lần build nào cũng đọc bản mới nhất.
import { rmSync } from 'node:fs'

rmSync(new URL('../.next/cache/fetch-cache', import.meta.url), { recursive: true, force: true })
