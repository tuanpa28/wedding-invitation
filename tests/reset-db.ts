import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as schema from '../src/server/db/schema'
import { seed } from '../src/server/db/seed'

/**
 * Dựng lại database test từ migration rồi seed dữ liệu mẫu (dùng cho Vitest và Playwright).
 * Chỉ chạy với database có tên kết thúc bằng `_test` để không bao giờ xoá nhầm dữ liệu dev.
 */
export async function resetTestDatabase(url: string | undefined) {
  if (!url || !new URL(url).pathname.endsWith('_test')) {
    throw new Error(`Từ chối reset database không phải database test: ${url ?? '(trống)'}`)
  }

  const pool = new Pool({ connectionString: url })
  try {
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE')
    await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE')
    await pool.query('CREATE SCHEMA public')
    await migrate(drizzle(pool), { migrationsFolder: 'drizzle' })
    await seed(drizzle(pool, { schema }))
  } finally {
    await pool.end()
  }
}
