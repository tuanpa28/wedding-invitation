import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

export type Db = ReturnType<typeof createDb>

function createDb(pool: Pool) {
  return drizzle(pool, { schema })
}

// Chỉ giữ connection pool trên globalThis để không mở thêm kết nối mỗi lần Next.js hot reload.
// Instance Drizzle tạo lại theo module → luôn dùng schema mới nhất sau khi sửa schema.ts.
const globalForDb = globalThis as unknown as { thiephongPool?: Pool }
let db: Db | undefined

/** Lấy kết nối DB. Khởi tạo lười để `next build` không cần DATABASE_URL. */
export function getDb(): Db {
  if (db) return db

  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL chưa được cấu hình (xem .env.example)')

  globalForDb.thiephongPool ??= new Pool({
    connectionString: url,
    max: 5,
    connectionTimeoutMillis: 5_000,
  })
  db = createDb(globalForDb.thiephongPool)
  return db
}
