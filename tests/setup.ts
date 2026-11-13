import { loadEnvConfig } from '@next/env'
import { vi } from 'vitest'

// Nạp biến môi trường giống Next.js. Ở chế độ test, Next đọc .env.test (database thiephong_test).
loadEnvConfig(process.cwd())

// Gọi route handler trực tiếp trong test thì không có request scope của Next.js,
// nên connection() (chỉ dùng để đánh dấu "chạy lúc request") được thay bằng no-op.
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: async () => {},
}))
