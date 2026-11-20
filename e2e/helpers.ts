import { spawnSync } from 'node:child_process'
import { expect, type Page } from '@playwright/test'

export const ADMIN = 'admin@thiephong.test'
const PROJECT = 'demo-thiephong'
const FIRESTORE = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8085'

/** Xoá sạch Firestore emulator rồi ghi lại thiệp mẫu + khách mẫu + admin thử */
export async function resetData() {
  const res = await fetch(
    `http://${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    { method: 'DELETE' },
  )
  expect(res.ok, 'xoá dữ liệu emulator').toBe(true)
  const seed = spawnSync('npx', ['tsx', 'scripts/seed.mts'], {
    shell: true,
    encoding: 'utf8',
    env: { ...process.env, FIRESTORE_EMULATOR_HOST: FIRESTORE },
  })
  expect(seed.status, seed.stderr || seed.stdout).toBe(0)
}

/** Mở /admin và đăng nhập bằng tài khoản Google giả của Auth Emulator */
export async function signIn(page: Page, email = ADMIN, path = '/admin') {
  await page.goto(path)
  await page.waitForFunction(() => '__thiephongTestSignIn' in window)
  await page.evaluate(
    (e) =>
      (
        window as unknown as { __thiephongTestSignIn: (e: string) => Promise<unknown> }
      ).__thiephongTestSignIn(e),
    email,
  )
  await expect(nav(page)).toBeVisible()
}

export const nav = (page: Page) => page.getByRole('navigation', { name: 'Mục quản lý' })

/** Chuyển tab bằng menu (trên điện thoại menu cuộn ngang, Playwright tự cuộn tới) */
export async function openTab(page: Page, label: string) {
  await nav(page).getByRole('button', { name: label }).click()
  await expect(page.getByRole('region', { name: label })).toBeVisible()
}

/** Dòng khách trong danh sách theo tên */
export const guestRow = (page: Page, name: string) =>
  page.getByRole('region', { name: 'Khách mời' }).getByRole('listitem').filter({ hasText: name })
