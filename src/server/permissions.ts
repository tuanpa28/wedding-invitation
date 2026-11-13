import 'server-only'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from './db'
import { weddingMembers, weddings } from './db/schema'
import { HttpError, notFoundError } from './http'

export type MemberRole = 'owner' | 'editor'

export interface WeddingAccess {
  role: MemberRole
  slug: string
  status: 'draft' | 'published' | 'locked'
}

/**
 * Kiểm tra user có quyền với thiệp. Mọi thao tác dashboard đều đi qua đây.
 * Không phải thành viên → 404 (không tiết lộ thiệp có tồn tại hay không).
 * Cần quyền owner mà chỉ là editor → 403.
 */
export async function requireWeddingAccess(
  userId: string,
  weddingId: string,
  minRole: MemberRole = 'editor',
): Promise<WeddingAccess> {
  if (!z.uuid().safeParse(weddingId).success) throw notFoundError()

  const [row] = await getDb()
    .select({ role: weddingMembers.role, slug: weddings.slug, status: weddings.status })
    .from(weddingMembers)
    .innerJoin(weddings, eq(weddingMembers.weddingId, weddings.id))
    .where(and(eq(weddingMembers.weddingId, weddingId), eq(weddingMembers.userId, userId)))
    .limit(1)

  if (!row) throw notFoundError()
  if (minRole === 'owner' && row.role !== 'owner') {
    throw new HttpError(403, 'forbidden', 'Chỉ người tạo thiệp mới làm được việc này')
  }
  return row
}
