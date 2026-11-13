import { expect, test } from '@playwright/test'
import { createWeddingViaWizard, devLogin, e2eEmail } from './helpers'

const uniqueSlug = (prefix: string) => `${prefix}-${Date.now().toString(36)}`

test('chưa đăng nhập vào dashboard → chuyển tới trang đăng nhập', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/)
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible()
})

test('cặp đôi tạo thiệp, thêm sự kiện, gửi thiệp → khách mở được link', async ({ page }) => {
  const slug = uniqueSlug('anh-ngoc')
  await devLogin(page, e2eEmail('a'))
  await expect(page.getByRole('heading', { name: /Chào/ })).toBeVisible()

  await createWeddingViaWizard(page, { groom: 'Đức Anh', bride: 'Bảo Ngọc', slug })
  await expect(page.getByRole('heading', { name: /Đức Anh.*Bảo Ngọc/ })).toBeVisible()

  // Bản nháp: khách chưa xem được
  const guest = await page.context().browser()!.newPage()
  await guest.goto(`/${slug}`)
  await expect(guest.getByRole('heading', { name: 'Không tìm thấy thiệp' })).toBeVisible()

  // Thêm Lễ Vu Quy nhà gái
  await page.getByRole('tab', { name: 'Sự kiện' }).click()
  await page.getByRole('button', { name: 'Sự kiện nhà gái' }).click()
  await page.getByLabel('Ngày giờ').fill('2027-04-18T09:00')
  await page.getByLabel('Nơi tổ chức').fill('Tư gia nhà gái')
  await page.getByLabel('Địa chỉ').fill('12 Lê Lợi, TP. Huế')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Đã lưu sự kiện')).toBeVisible()

  // Sửa thông tin bố mẹ
  await page.getByRole('tab', { name: 'Thông tin' }).click()
  await page.locator('#bride-father').fill('Ông Trần Văn Bình')
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click()
  await expect(page.getByText('Đã lưu thông tin')).toBeVisible()

  // Gửi thiệp
  await page.getByRole('tab', { name: 'Gửi thiệp' }).click()
  await page.getByRole('button', { name: 'Gửi thiệp', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Chuyển về nháp' })).toBeVisible()

  // Khách mở link ngay (cache đã được xoá khi gửi)
  await guest.goto(`/${slug}`)
  await expect(guest.getByText('Lễ Vu Quy').first()).toBeAttached()
  await expect(guest.getByText('Tư gia nhà gái').first()).toBeAttached()
  await expect(guest).toHaveTitle(/Đức Anh & Bảo Ngọc/)
  await guest.close()
})

test('user B không xem và không sửa được thiệp của user A', async ({ browser }) => {
  const slug = uniqueSlug('rieng')
  const a = await browser.newPage()
  await devLogin(a, e2eEmail('owner'))
  const id = await createWeddingViaWizard(a, { groom: 'Quốc Bảo', bride: 'Thu Hà', slug })

  const b = await browser.newPage()
  await devLogin(b, e2eEmail('stranger'))

  // Trang sửa: báo không tìm thấy
  await b.goto(`/dashboard/${id}`)
  await expect(b.getByRole('heading', { name: 'Không tìm thấy thiệp' })).toBeVisible()
  // Trang xem trước bản nháp: cũng không
  await b.goto(`/dashboard/${id}/preview`)
  await expect(b.getByRole('heading', { name: 'Không tìm thấy thiệp' })).toBeVisible()

  // Gọi thẳng API bằng phiên của B
  const patch = await b.request.patch(`/api/weddings/${id}`, {
    data: { quote: 'B sửa trộm' },
  })
  expect(patch.status()).toBe(404)
  const remove = await b.request.delete(`/api/weddings/${id}`)
  expect(remove.status()).toBe(404)
  const list = await b.request.get('/api/weddings')
  expect((await list.json()).weddings).toEqual([])

  // Dữ liệu của A vẫn nguyên
  const own = await a.request.get(`/api/weddings/${id}`)
  expect(own.status()).toBe(200)
  expect((await own.json()).wedding.quote).toBeNull()

  await a.close()
  await b.close()
})

test('mời đồng quản lý bằng link', async ({ browser }) => {
  const slug = uniqueSlug('chung')
  const a = await browser.newPage()
  await a
    .context()
    .grantPermissions(['clipboard-read', 'clipboard-write'])
    .catch(() => {})
  await devLogin(a, e2eEmail('chu'))
  const id = await createWeddingViaWizard(a, { groom: 'Hoàng Anh', bride: 'Minh Thư', slug })

  await a.getByRole('tab', { name: 'Gửi thiệp' }).click()
  await a.getByRole('button', { name: 'Tạo link mời' }).click()
  const link = (await a
    .getByText(/\/invite\//)
    .first()
    .textContent())!.trim()
  const token = link.split('/invite/')[1]

  const b = await browser.newPage()
  await b.goto(`/invite/${token}`)
  await expect(b.getByText('Bạn được mời cùng quản lý thiệp cưới')).toBeVisible()
  await b.getByRole('link', { name: 'Đăng nhập để nhận lời mời' }).click()
  await b.getByLabel('Email').fill(e2eEmail('ban'))
  await b.getByLabel('Mật khẩu').fill('mat-khau-e2e-123')
  await b.getByRole('button', { name: 'Vào bằng tài khoản thử' }).click()
  await expect(b).toHaveURL(new RegExp(`/invite/${token}$`))
  await b.getByRole('button', { name: 'Nhận lời mời' }).click()

  await expect(b).toHaveURL(new RegExp(`/dashboard/${id}$`))
  await expect(b.getByRole('heading', { name: /Hoàng Anh.*Minh Thư/ })).toBeVisible()

  // Link đã dùng thì người khác không dùng lại được
  const c = await browser.newPage()
  await c.goto(`/invite/${token}`)
  await expect(c.getByText('Link mời này đã được dùng.')).toBeVisible()

  await Promise.all([a.close(), b.close(), c.close()])
})
