import { expect, type Page } from '@playwright/test'

/** Mật khẩu chung của các tài khoản thử E2E (chỉ tồn tại trong database test) */
export const E2E_PASSWORD = 'mat-khau-e2e-123'

/** Email mới cho mỗi lần chạy để các lần chạy không đụng nhau */
export const e2eEmail = (who: string) =>
  `${who}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@thiephong.test`

/** Đăng nhập bằng form tài khoản thử (tự tạo tài khoản nếu chưa có) */
export async function devLogin(page: Page, email: string, next = '/dashboard') {
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mật khẩu').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: 'Vào bằng tài khoản thử' }).click()
  await expect(page).toHaveURL((url) => url.pathname === next)
}

/** Tạo thiệp qua wizard, trả về id thiệp (lấy từ URL trang sửa) */
export async function createWeddingViaWizard(
  page: Page,
  { groom, bride, slug }: { groom: string; bride: string; slug: string },
) {
  await page.goto('/dashboard/new')
  await page.getByLabel('Chú rể').fill(groom)
  await page.getByLabel('Cô dâu').fill(bride)
  await page.getByRole('button', { name: 'Tiếp' }).click()

  const slugInput = page.getByLabel('Đường dẫn')
  await slugInput.fill(slug)
  await expect(page.getByText('Dùng được')).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp' }).click()

  await page.getByRole('radio', { name: /Hoa Cỏ/ }).click()
  await page.getByRole('button', { name: 'Tạo thiệp' }).click()
  await expect(page).toHaveURL(/\/dashboard\/[0-9a-f-]{36}$/)
  return page.url().split('/').at(-1)!
}
