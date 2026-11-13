import 'server-only'
import { sql } from 'drizzle-orm'
import type { HealthResponse } from '@/lib/types/health'
import { getDb, type Db } from '@/server/db'

/** Kiểm tra kết nối Postgres bằng một query đơn giản */
export async function checkDatabase(db?: Db): Promise<HealthResponse['db']> {
  const started = performance.now()
  try {
    await (db ?? getDb()).execute(sql`select 1`)
    return { ok: true, latencyMs: Math.round(performance.now() - started) }
  } catch (err) {
    console.error('[health] database check failed:', err instanceof Error ? err.message : err)
    return { ok: false, error: 'database_unreachable' }
  }
}
