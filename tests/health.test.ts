import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { describe, expect, it } from 'vitest'
import { GET } from '@/app/api/health/route'
import type { HealthResponse } from '@/lib/types/health'
import { checkDatabase } from '@/server/services/health'

describe('GET /api/health', () => {
  it('trả về 200 và kết nối được Postgres', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')

    const body = (await res.json()) as HealthResponse
    expect(body.ok).toBe(true)
    expect(body.app).toBe('Thiệp Hồng')
    expect(body.db.ok).toBe(true)
  })
})

describe('checkDatabase', () => {
  it('báo lỗi khi không kết nối được database', async () => {
    // Cổng 1 không có Postgres nào → kết nối thất bại ngay
    const pool = new Pool({
      connectionString: 'postgres://x:x@127.0.0.1:1/x',
      connectionTimeoutMillis: 1_000,
    })
    const result = await checkDatabase(drizzle(pool))
    await pool.end()

    expect(result).toEqual({ ok: false, error: 'database_unreachable' })
  })
})
