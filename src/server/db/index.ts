import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export type Db = ReturnType<typeof createDb>

function createDb(connectionString: string) {
  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 5_000 })
  return drizzle(pool, { schema })
}

// Giữ 1 instance duy nhất khi Next.js hot reload ở môi trường dev
const globalForDb = globalThis as unknown as { thiephongDb?: Db }

/** Lấy kết nối DB. Khởi tạo lười để `next build` không cần DATABASE_URL. */
export function getDb(): Db {
  if (globalForDb.thiephongDb) return globalForDb.thiephongDb

  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL chưa được cấu hình (xem .env.example)')

  const db = createDb(url)
  globalForDb.thiephongDb = db
  return db
}
