import { defineConfig, devices } from '@playwright/test'

/**
 * Test trên trình duyệt: chạy bằng `npm run test:e2e`.
 * Lệnh đó build site tĩnh trỏ vào emulator, rồi bật Firestore + Auth + Hosting emulator
 * (cổng 5005, có rewrite /m/** như Firebase Hosting thật) và chạy Playwright bên trong.
 * Dùng Microsoft Edge có sẵn trên Windows → không phải tải trình duyệt của Playwright.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // các test dùng chung một emulator, chạy lần lượt
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5005',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'msedge' } },
  ],
})
