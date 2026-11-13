import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import type { HealthResponse } from '../../shared/health'
import { getDb } from '../db'
import type { AppEnv } from '../types'

export const health = new Hono<AppEnv>().get('/', async (c) => {
  const started = Date.now()
  const base = { app: c.env.APP_NAME, time: new Date().toISOString() }

  try {
    const db = getDb(c.env.DB)
    await db.get(sql`select 1 as ok`)
    const body: HealthResponse = {
      ...base,
      ok: true,
      db: { ok: true, latencyMs: Date.now() - started },
    }
    return c.json(body)
  } catch (err) {
    console.error('health check failed', err)
    const body: HealthResponse = {
      ...base,
      ok: false,
      db: { ok: false, error: 'database_unreachable' },
    }
    return c.json(body, 503)
  }
})
