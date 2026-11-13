import { defineConfig, devices } from '@playwright/test'
import { E2E_BASE_URL as baseURL, E2E_DATABASE_URL, E2E_PORT as PORT } from './e2e/env'

/**
 * E2E chạy trên bản build production (next build + next start, cổng 3100) với database test.
 * Dùng Microsoft Edge có sẵn trên Windows → không cần tải trình duyệt của Playwright.
 * Đăng nhập bằng tài khoản thử (DEV_LOGIN) vì Google OAuth không tự động hoá được.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-edge',
      use: { ...devices['Pixel 7'], channel: 'msedge' },
    },
    {
      name: 'desktop-edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `${baseURL}/api/health`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      BETTER_AUTH_URL: baseURL,
      // Chỉ dùng cho E2E trên máy local
      BETTER_AUTH_SECRET: 'Qm7vR2xK9pL4wN8sT1yZ6bH3cJ5dF0gA',
      DEV_LOGIN: 'true',
      REVALIDATE_SECRET: 'test-secret',
      NEXT_PUBLIC_SITE_URL: baseURL,
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
    },
  },
})
