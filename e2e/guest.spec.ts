import { expect, test, type Page } from '@playwright/test'
import {
  ADMIN_CONTENT,
  addWish,
  FieldValue,
  guest,
  guestOpenCount,
  rsvp,
  setWedding,
  TEMPLATE_MARK,
  TEMPLATES,
  type TemplateId,
} from './data'
import { resetData } from './helpers'

// Trang của khách. Mỗi test dựng dữ liệu như admin vừa lưu rồi mở thiệp như khách thật.
// Thiệp luôn chạy đủ hiệu ứng (không theo cài đặt "giảm chuyển động" của máy).

test.beforeEach(async () => {
  await resetData()
})

/** Bấm mở thiệp (mẫu nào cũng phải mở trước mới xem được nội dung) */
async function openInvitation(page: Page) {
  const button = page.getByRole('button', { name: /mở thiệp/i }).first()
  await expect(button).toBeVisible()
  // Chưa mở: nội dung chính chưa xem được (trang khoá cuộn, phần thiệp bị che/ẩn)
  await expect(page.locator('[data-phase="closed"]')).toBeAttached()
  // force: con dấu của Hoa Cỏ "thở" liên tục nên không bao giờ đứng yên để Playwright chờ
  await button.click({ force: true })
  await expect(page.locator('[data-phase="open"]')).toBeAttached({ timeout: 10_000 })
}

const body = (page: Page) => page.locator('body')

async function useAdminContent(templateId: TemplateId, extra: Record<string, unknown> = {}) {
  await setWedding({ templateId, ...ADMIN_CONTENT, ...extra })
}

/** Cuộn hết trang rồi kiểm tra không phần tử nào làm trang rộng hơn màn hình */
async function expectNoHorizontalOverflow(page: Page) {
  const width = page.viewportSize()!.width
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 30))
    }
  })
  expect(await page.evaluate(() => window.innerWidth)).toBe(width)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
}

for (const templateId of TEMPLATES) {
  test.describe(`Mẫu ${templateId}`, () => {
    test('link riêng: hiện đúng mọi thông tin admin nhập', async ({ page }) => {
      await useAdminContent(templateId, { musicUrl: 'https://example.com/nhac.mp3' })
      await page.goto('/m/nam2027?preview')

      // Màn bìa có tên khách, chưa thấy nội dung
      await expect(body(page)).toContainText('Anh Nam')
      await openInvitation(page)
      await expect(page).toHaveTitle('Kính mời Anh Nam — Lễ cưới Hoàng Minh & Thu Trang')

      const text = body(page)
      await expect(text).toContainText(TEMPLATE_MARK[templateId])
      for (const value of [
        'Hoàng Minh',
        'Thu Trang',
        'Ông Lê Văn Cha',
        'Bà Đỗ Thị Mẹ',
        'Ông Phạm Văn Bố',
        'Bà Vũ Thị Má',
        'Câu trích dẫn do admin nhập',
        // Khách nhà trai: chỉ lễ nhà trai
        'Lễ Thành Hôn',
        'Tư gia nhà trai thử',
      ]) {
        await expect(text).toContainText(value)
      }
      // Không thấy lễ nhà gái, cũng không thấy lễ chung
      await expect(text).not.toContainText('Tư gia nhà gái thử')
      await expect(text).not.toContainText('Nhà hàng chung thử')

      // Link Google Maps admin dán vào được dùng cho nút "Chỉ đường"
      await expect(
        page.locator('a[href="https://maps.app.goo.gl/nhaTraiThu"]').first(),
      ).toBeAttached()
      // Có nhạc nền → có nút bật/tắt nhạc
      await expect(page.getByRole('button', { name: /(Bật|Tắt) nhạc/ })).toBeVisible()
      await expectNoHorizontalOverflow(page)
    })

    test('link chung: chỉ lễ chung hai bên', async ({ page }) => {
      await useAdminContent(templateId)
      await page.goto('/?preview')
      await openInvitation(page)
      const text = body(page)
      await expect(text).toContainText('Nhà hàng chung thử')
      await expect(text).not.toContainText('Tư gia nhà trai thử')
      await expect(text).not.toContainText('Tư gia nhà gái thử')
      await expect(text).not.toContainText('Anh Nam')
      await expect(page).toHaveTitle('Lễ cưới Hoàng Minh & Thu Trang')
    })

    test('link chung khi chưa có lễ chung: vẫn mở thiệp, không có sự kiện nào', async ({
      page,
    }) => {
      await useAdminContent(templateId, {
        events: ADMIN_CONTENT.events.filter((e) => e.side !== 'both'),
      })
      await page.goto('/?preview')
      await openInvitation(page)
      const text = body(page)
      await expect(text).toContainText('Hoàng Minh')
      await expect(text).not.toContainText('Lễ Thành Hôn')
      await expect(text).not.toContainText('Tư gia nhà trai thử')
      await expect(text).not.toContainText('Tư gia nhà gái thử')
      await expectNoHorizontalOverflow(page)
    })

    test('khách nhà gái: tên cô dâu trước, sự kiện nhà gái, tài khoản nhà gái trước', async ({
      page,
    }) => {
      await useAdminContent(templateId)
      await page.goto('/m/cohoa27?preview')
      await openInvitation(page)
      const text = body(page)
      await expect(text).toContainText('Tư gia nhà gái thử')
      await expect(text).not.toContainText('Tư gia nhà trai thử')
      await expect(text).not.toContainText('Nhà hàng chung thử')

      const giftBox = page.getByRole('button', { name: /Hộp quà cưới/ })
      if (await giftBox.count()) await giftBox.click()
      const bride = page.getByText('4444555566')
      const groom = page.getByText('1111222233')
      await expect(bride).toBeVisible()
      await expect(groom).toBeVisible()
      const [b, g] = await Promise.all([bride.boundingBox(), groom.boundingBox()])
      // Nhà gái đứng trước: ở trên (điện thoại) hoặc bên trái (máy tính)
      expect(b!.y < g!.y || b!.x < g!.x).toBe(true)

      // Mã QR chỉ tải khi khách bấm
      await expect(page.locator('img[src*="img.vietqr.io"]')).toHaveCount(0)
      await page.getByRole('button', { name: 'Hiện mã QR' }).first().click()
      await expect(page.locator('img[src*="img.vietqr.io/image/970418-4444555566"]')).toBeAttached()
    })

    test('xác nhận tham dự: gửi, giới hạn số người, tải lại vẫn nhớ, sửa câu trả lời', async ({
      page,
    }) => {
      await useAdminContent(templateId)
      await guest('nam2027').update({ maxAttendees: 2 })
      await page.goto('/m/nam2027?preview')
      await openInvitation(page)

      const form = page
        .locator('form')
        .filter({ has: page.getByRole('button', { name: 'Gửi xác nhận' }) })
      await expect(form.getByLabel('Tên của bạn')).toHaveValue('Anh Nam')
      await form.getByRole('radio', { name: 'Sẽ đến chung vui' }).click()
      await expect(form).toContainText('tối đa 2')
      await form.getByRole('button', { name: 'Thêm một người' }).click()
      await expect(form.getByRole('button', { name: 'Thêm một người' })).toBeDisabled()
      await form.getByRole('textbox').last().fill('Ăn chay')
      await form.getByRole('button', { name: 'Gửi xác nhận' }).click()

      await expect(page.getByText('Cảm ơn Anh Nam! Hẹn gặp 2 người trong ngày vui.')).toBeVisible()
      await expect
        .poll(() => rsvp('nam2027'))
        .toMatchObject({ attending: true, count: 2, note: 'Ăn chay' })

      // Tải lại: máy khách nhớ câu trả lời
      await page.reload()
      await openInvitation(page)
      await expect(page.getByText('Cảm ơn Anh Nam! Hẹn gặp 2 người trong ngày vui.')).toBeVisible()

      await page.getByRole('button', { name: 'Sửa câu trả lời' }).click()
      await page.getByRole('radio', { name: 'Không đến được' }).click()
      await page.getByRole('button', { name: 'Gửi xác nhận' }).click()
      await expect(page.getByText(/đã báo\. Tiếc quá/)).toBeVisible()
      await expect.poll(() => rsvp('nam2027')).toMatchObject({ attending: false, count: 0 })
    })

    test('sổ lưu bút: gửi lời chúc hiện ngay, lời chúc đã ẩn không hiện', async ({ page }) => {
      await useAdminContent(templateId)
      await addWish('Bạn Cũ', 'Lời chúc đang hiện')
      await addWish('Spam', 'Lời chúc bị admin ẩn', true)
      await page.goto('/m/nam2027?preview')
      await openInvitation(page)

      await expect(page.getByText('Lời chúc đang hiện')).toBeVisible()
      await expect(body(page)).not.toContainText('Lời chúc bị admin ẩn')

      await page.getByRole('button', { name: 'Gửi lời chúc' }).click()
      await expect(page.getByText('Viết đôi lời chúc nhé')).toBeVisible()

      await page.getByLabel('Lời chúc').fill('Chúc hai bạn trăm năm hạnh phúc')
      await page.getByRole('button', { name: 'Gửi lời chúc' }).click()
      await expect(
        page.getByRole('listitem').filter({ hasText: 'Chúc hai bạn trăm năm hạnh phúc' }),
      ).toContainText('Anh Nam')
      await expect(page.getByRole('button', { name: 'Đã gửi — cảm ơn bạn!' })).toBeVisible()
    })
  })
}

test.describe('Máy bật "giảm chuyển động" vẫn chạy hiệu ứng', () => {
  test.use({ reducedMotion: 'reduce' })
  for (const templateId of TEMPLATES) {
    test(`mẫu ${templateId}: bấm mở phong bì rồi vào thiệp`, async ({ page }) => {
      await useAdminContent(templateId)
      await page.goto('/m/nam2027?preview')
      await openInvitation(page)
      // Sau hiệu ứng, tên cô dâu chú rể hiện rõ và cuộn được trang
      await expect(body(page)).toContainText('Hoàng Minh')
      await page.mouse.wheel(0, 1500)
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200)
      await expectNoHorizontalOverflow(page)
    })
  }
})

test.describe('Cài đặt của admin', () => {
  test('tắt xác nhận tham dự và sổ lưu bút → thiệp không có hai mục này', async ({ page }) => {
    await useAdminContent('song-hy', { rsvpEnabled: false, wishesEnabled: false })
    await page.goto('/m/nam2027?preview')
    await openInvitation(page)
    await expect(page.getByRole('button', { name: 'Gửi xác nhận' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Gửi lời chúc' })).toHaveCount(0)
  })

  test('quá hạn xác nhận → báo đã hết hạn, không có form', async ({ page }) => {
    await useAdminContent('hoa-co', { rsvpDeadline: '2020-01-01' })
    await page.goto('/m/nam2027?preview')
    await openInvitation(page)
    await expect(page.getByText('Đã hết hạn xác nhận', { exact: false })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Gửi xác nhận' })).toHaveCount(0)
  })

  test('không có tài khoản mừng cưới, không có nhạc → không hiện hai mục này', async ({ page }) => {
    await useAdminContent('nga', { gifts: FieldValue.delete(), musicUrl: FieldValue.delete() })
    await page.goto('/m/nam2027?preview')
    await openInvitation(page)
    await expect(page.getByText('Hộp quà cưới')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /(Bật|Tắt) nhạc/ })).toHaveCount(0)
  })

  test('link chung: khách tự điền tên và chọn bên', async ({ page }) => {
    await useAdminContent('song-hy')
    await page.goto('/?preview')
    await openInvitation(page)
    const form = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Gửi xác nhận' }) })
    await form.getByRole('button', { name: 'Gửi xác nhận' }).click()
    // Thiếu tên, bên, có đến không → báo lỗi, không gửi
    await expect(form.getByText('Nhập tên của bạn')).toBeVisible()
    await expect(form.getByText('Bạn là khách nhà trai hay nhà gái?')).toBeVisible()
    await expect(form.getByText('Chọn có đến được không')).toBeVisible()

    await form.getByLabel('Tên của bạn').fill('Khách Link Chung')
    await form.getByRole('radio', { name: 'Nhà gái' }).click()
    await form.getByRole('radio', { name: 'Sẽ đến chung vui' }).click()
    await form.getByRole('button', { name: 'Gửi xác nhận' }).click()
    await expect(page.getByText('Cảm ơn Khách Link Chung!', { exact: false })).toBeVisible()
  })
})

test.describe('Link và lượt mở', () => {
  test('khách mở link riêng được tính một lượt; xem trước từ admin thì không', async ({ page }) => {
    await page.goto('/m/nam2027?preview')
    await openInvitation(page)
    await page.waitForTimeout(1500)
    expect(await guestOpenCount('nam2027')).toBe(0)

    await page.goto('/m/cohoa27')
    await openInvitation(page)
    await expect.poll(() => guestOpenCount('cohoa27')).toBe(1)
  })

  test('mã khách sai → báo không tìm thấy; /m không mã → về link chung', async ({ page }) => {
    await page.goto('/m/khongco99')
    await expect(page.getByRole('heading', { name: 'Không tìm thấy thiệp' })).toBeVisible()

    await page.goto('/m')
    await expect(page).toHaveURL(/127\.0\.0\.1:5005\/$/)
  })
})
