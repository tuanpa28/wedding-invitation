import { connection } from 'next/server'
import type { HealthResponse } from '@/lib/types/health'
import { checkDatabase } from '@/server/services/health'

export async function GET() {
  // Luôn chạy lúc có request thật, không prerender lúc build
  await connection()

  const db = await checkDatabase()
  const body: HealthResponse = {
    ok: db.ok,
    app: 'Thiệp Hồng',
    time: new Date().toISOString(),
    db,
  }

  return Response.json(body, {
    status: db.ok ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
