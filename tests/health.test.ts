import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getPlatformProxy, type PlatformProxy } from 'wrangler'
import { app } from '../server/app'
import type { HealthResponse } from '../shared/health'

// Chạy Hono app với D1 giả lập (miniflare) đọc từ wrangler.toml — không cần tài khoản Cloudflare
let proxy: PlatformProxy<Env>

beforeAll(async () => {
  proxy = await getPlatformProxy<Env>({ persist: false })
})

afterAll(async () => {
  await proxy?.dispose()
})

describe('GET /api/health', () => {
  it('trả về ok và kết nối được D1', async () => {
    const res = await app.request('/api/health', {}, proxy.env)
    expect(res.status).toBe(200)

    const body = (await res.json()) as HealthResponse
    expect(body.ok).toBe(true)
    expect(body.app).toBe('Thiệp Hồng')
    expect(body.db.ok).toBe(true)
  })

  it('trả về 503 khi D1 lỗi', async () => {
    const brokenDb = {
      prepare: () => {
        throw new Error('boom')
      },
    } as unknown as D1Database
    const res = await app.request('/api/health', {}, { ...proxy.env, DB: brokenDb })
    expect(res.status).toBe(503)
    const body = (await res.json()) as HealthResponse
    expect(body.ok).toBe(false)
  })
})

describe('route không tồn tại', () => {
  it('trả về 404 JSON', async () => {
    const res = await app.request('/api/khong-co', {}, proxy.env)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'not_found' })
  })
})
