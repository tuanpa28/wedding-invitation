// Seed dữ liệu thiệp mẫu vào database trong DATABASE_URL (mặc định: Postgres local).
// Chạy: npm run db:seed
// @next/env là CommonJS → import default rồi lấy hàm ra
import nextEnv from '@next/env'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { seedWeddings } from '../src/mocks/invitations'
import * as schema from '../src/server/db/schema'
import { seed } from '../src/server/db/seed'

nextEnv.loadEnvConfig(process.cwd())

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL chưa được cấu hình (xem .env.example)')

const pool = new Pool({ connectionString: url })
try {
  await seed(drizzle(pool, { schema }))
  for (const { invitation, status, guests } of seedWeddings) {
    const links = guests.map((g) => `/${invitation.slug}/${g.code}`).join(', ')
    console.log(`✓ ${invitation.slug} (${status}) — khách: ${links}`)
  }
} finally {
  await pool.end()
}

// Nếu app đang chạy thì xoá cache các thiệp vừa seed để thấy dữ liệu mới ngay
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const secret = process.env.REVALIDATE_SECRET
if (secret) {
  try {
    for (const { invitation } of seedWeddings) {
      await fetch(`${siteUrl}/api/revalidate`, {
        method: 'POST',
        headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
        body: JSON.stringify({ slug: invitation.slug }),
        signal: AbortSignal.timeout(3_000),
      })
    }
    console.log(`✓ Đã xoá cache trên ${siteUrl}`)
  } catch {
    console.log(`(Bỏ qua xoá cache: app không chạy ở ${siteUrl})`)
  }
}
