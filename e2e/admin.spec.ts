import { expect, test } from '@playwright/test'
import { ADMIN, guestRow, nav, openTab, resetData, signIn } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetData()
  await signIn(page)
})

test('Tổng quan: sự kiện sắp tới, số liệu, việc cần chuẩn bị', async ({ page }) => {
  // Không phần tử nào làm trang rộng hơn màn hình (điện thoại sẽ tự thu nhỏ cả trang)
  const width = page.viewportSize()!.width
  expect(await page.evaluate(() => window.innerWidth)).toBe(width)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)

  const overview = page.getByRole('region', { name: 'Tổng quan' })
  await expect(overview.getByText(/Sự kiện (sắp tới|gần nhất đã qua)/i)).toBeVisible()
  await expect(overview.getByLabel('Link thiệp chung')).toHaveValue(/\/$/)
  await expect(overview.getByRole('button', { name: /Khách mời\s*2/ })).toBeVisible()
  // Dữ liệu mẫu chưa gửi thiệp cho ai
  await expect(overview.getByText('Còn 2 khách chưa gửi')).toBeVisible()

  // Bấm việc cần làm → tới đúng tab
  await overview.getByRole('button', { name: /Danh sách khách mời/ }).click()
  await expect(page.getByRole('region', { name: 'Khách mời' })).toBeVisible()
  await expect(page).toHaveURL(/#guests$/)
})

test('Không mất phần đang sửa khi đổi tab; Ctrl+S để lưu', async ({ page }) => {
  await openTab(page, 'Thông tin')
  const name = page.getByRole('region', { name: 'Thông tin' }).getByLabel('Tên gọi').first()
  await name.fill('Quang Huy Test')
  await expect(nav(page).getByRole('button', { name: /Thông tin.*chưa lưu/ })).toBeVisible()

  await openTab(page, 'Sự kiện')
  await openTab(page, 'Thông tin')
  await expect(name).toHaveValue('Quang Huy Test')

  await name.press('Control+s')
  await expect(page.getByText('Đã lưu thông tin')).toBeVisible()
  await expect(nav(page).getByRole('button', { name: /Thông tin.*chưa lưu/ })).toHaveCount(0)

  // Tải lại trang: vẫn ở tab Thông tin (#info) và đã lưu thật
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Thông tin' }).getByLabel('Tên gọi').first(),
  ).toHaveValue('Quang Huy Test')
})

test('Sự kiện: mỗi bên một Lễ Thành Hôn, tối đa 3', async ({ page }) => {
  await openTab(page, 'Sự kiện')
  const events = page.getByRole('region', { name: 'Sự kiện' })
  // Dữ liệu mẫu đủ 3 bên → không còn nút thêm, không chọn loại lễ hay bên tổ chức
  await expect(events.getByRole('listitem')).toHaveCount(3)
  await expect(events.getByRole('button', { name: /^Sự kiện/ })).toHaveCount(0)
  await expect(events.getByLabel('Loại lễ')).toHaveCount(0)

  // Xoá lễ nhà trai → hiện lại đúng nút thêm lễ nhà trai
  const groom = events.getByRole('listitem').filter({ hasText: 'Nhà trai' })
  await groom.getByRole('button', { name: 'Xoá sự kiện' }).click()
  await expect(events.getByRole('button', { name: /^Sự kiện/ })).toHaveText(['Sự kiện nhà trai'])
})

test('Gửi thiệp: chép tin nhắn tự đánh dấu đã gửi, menu ⋯, lọc chưa gửi', async ({ page }) => {
  await openTab(page, 'Khách mời')

  const nam = guestRow(page, 'Anh Nam')
  await expect(nam).toContainText('Chưa gửi')
  await nam.getByRole('button', { name: 'Chép tin nhắn mời' }).click()
  await expect(nam).toContainText('Đã gửi')
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('/m/nam2027')

  // Thao tác ít dùng nằm trong menu ⋯
  const hoa = guestRow(page, 'Cô Hoa')
  await hoa.getByRole('button', { name: /Thao tác khác/ }).click()
  await expect(page.getByRole('menuitem', { name: 'Chép link' })).toBeVisible()
  await expect(page.getByRole('menuitem', { name: 'Xoá khách' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Đánh dấu đã gửi' }).click()
  await expect(hoa).toContainText('Đã gửi')

  // Bỏ đánh dấu bằng cách bấm vào trạng thái
  await hoa.getByRole('button', { name: /Đã gửi .* chưa mở/ }).click()
  await expect(hoa).toContainText('Chưa gửi')

  // Tổng quan cập nhật theo
  await openTab(page, 'Tổng quan')
  await expect(page.getByText('Còn 1 khách chưa gửi')).toBeVisible()
})

test('Khách mở thiệp → trang quản lý thấy ngay', async ({ page, context }) => {
  await openTab(page, 'Khách mời')
  const hoa = guestRow(page, 'Cô Hoa')
  await expect(hoa).toContainText('Chưa gửi')

  const guest = await context.newPage()
  await guest.goto('/m/cohoa27')
  await expect(guest.getByText(/Cô Hoa/).first()).toBeVisible()

  await expect(hoa).toContainText(/Đã mở 1 lần/, { timeout: 15_000 })
  await openTab(page, 'Tổng quan')
  await expect(page.getByText(/Cô Hoa và gia đình\s*mở thiệp/)).toBeVisible()
})

test('Người quản lý: thêm người, người đó đăng nhập được, bỏ quyền', async ({ page, browser }) => {
  await openTab(page, 'Người quản lý')
  const list = page.getByRole('list', { name: 'Người quản lý' })
  await expect(list.getByRole('listitem').filter({ hasText: ADMIN })).toContainText('Bạn')

  const input = page.getByLabel('Thêm người quản lý')
  await input.fill('khong-phai-email')
  await page.getByRole('button', { name: 'Thêm', exact: true }).click()
  await expect(page.getByText('Email chưa đúng định dạng')).toBeVisible()

  await input.fill('Vo.Test@Gmail.com')
  await page.getByRole('button', { name: 'Thêm', exact: true }).click()
  await expect(list.getByText('vo.test@gmail.com')).toBeVisible()

  // Người mới đăng nhập ở trình duyệt khác là vào được trang quản lý
  const other = await browser.newContext({ baseURL: 'http://127.0.0.1:5005' })
  const coPage = await other.newPage()
  await signIn(coPage, 'vo.test@gmail.com')
  await other.close()

  await page.getByRole('button', { name: 'Bỏ quyền quản lý của vo.test@gmail.com' }).click()
  await page.getByRole('button', { name: 'Bỏ quyền', exact: true }).click()
  await expect(list.getByText('vo.test@gmail.com')).toHaveCount(0)
  // Không có nút tự bỏ quyền của chính mình
  await expect(page.getByRole('button', { name: `Bỏ quyền quản lý của ${ADMIN}` })).toHaveCount(0)
})
