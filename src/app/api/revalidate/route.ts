import { timingSafeEqual } from 'node:crypto'
import { refreshWedding } from '@/server/services/invitations'

/**
 * POST /api/revalidate  { "slug": "demo" }
 * Header: Authorization: Bearer <REVALIDATE_SECRET>
 *
 * Xoá cache của một thiệp sau khi sửa dữ liệu ngoài app (ví dụ sửa tay trong DB, chạy seed).
 * Dashboard (Phase 3) sẽ tự gọi refreshWedding sau mỗi lần lưu.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get('authorization'))) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  const slug =
    body && typeof body === 'object' && 'slug' in body && typeof body.slug === 'string'
      ? body.slug
      : null
  if (!slug) {
    return Response.json({ error: 'slug_required' }, { status: 400 })
  }

  refreshWedding(slug)
  return Response.json({ revalidated: true, slug })
}

function isAuthorized(header: string | null) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || !header) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(header)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
