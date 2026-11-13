import 'server-only'
import { randomBytes } from 'node:crypto'
import { and, asc, count, eq, gt, isNull } from 'drizzle-orm'
import { LIMITS } from '@/lib/invitation/defaults'
import { getDb } from '@/server/db'
import { user, weddingInvites, weddingMembers, weddings } from '@/server/db/schema'
import { HttpError } from '@/server/http'
import { requireWeddingAccess, type MemberRole } from '@/server/permissions'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface MemberInfo {
  userId: string
  name: string
  email: string
  image: string | null
  role: MemberRole
}

export interface PendingInvite {
  id: string
  token: string
  expiresAt: string
}

const activeInvite = (weddingId: string) =>
  and(
    eq(weddingInvites.weddingId, weddingId),
    isNull(weddingInvites.acceptedAt),
    gt(weddingInvites.expiresAt, new Date()),
  )

/** Thành viên của thiệp; owner thấy thêm các link mời còn hiệu lực */
export async function listMembers(userId: string, weddingId: string) {
  const { role } = await requireWeddingAccess(userId, weddingId)
  const db = getDb()
  const members: MemberInfo[] = await db
    .select({
      userId: weddingMembers.userId,
      name: user.name,
      email: user.email,
      image: user.image,
      role: weddingMembers.role,
    })
    .from(weddingMembers)
    .innerJoin(user, eq(weddingMembers.userId, user.id))
    .where(eq(weddingMembers.weddingId, weddingId))
    .orderBy(asc(weddingMembers.createdAt))

  const invites: PendingInvite[] =
    role === 'owner'
      ? (
          await db
            .select({
              id: weddingInvites.id,
              token: weddingInvites.token,
              expiresAt: weddingInvites.expiresAt,
            })
            .from(weddingInvites)
            .where(activeInvite(weddingId))
            .orderBy(asc(weddingInvites.createdAt))
        ).map((i) => ({ ...i, expiresAt: i.expiresAt.toISOString() }))
      : []

  return { members, invites }
}

/** Tạo link mời đồng quản lý (chỉ owner). Link dùng một lần, hết hạn sau 7 ngày. */
export async function createInvite(userId: string, weddingId: string): Promise<PendingInvite> {
  await requireWeddingAccess(userId, weddingId, 'owner')
  const db = getDb()
  const [[{ members }], [{ pending }]] = await Promise.all([
    db
      .select({ members: count() })
      .from(weddingMembers)
      .where(eq(weddingMembers.weddingId, weddingId)),
    db.select({ pending: count() }).from(weddingInvites).where(activeInvite(weddingId)),
  ])
  if (members + pending >= LIMITS.membersPerWedding) {
    throw new HttpError(
      403,
      'limit_reached',
      `Mỗi thiệp có tối đa ${LIMITS.membersPerWedding} người quản lý (tính cả link mời chưa dùng)`,
    )
  }

  const [invite] = await db
    .insert(weddingInvites)
    .values({
      weddingId,
      token: randomBytes(18).toString('base64url'),
      createdBy: userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    .returning({
      id: weddingInvites.id,
      token: weddingInvites.token,
      expiresAt: weddingInvites.expiresAt,
    })
  return { ...invite, expiresAt: invite.expiresAt.toISOString() }
}

export async function revokeInvite(userId: string, weddingId: string, inviteId: string) {
  await requireWeddingAccess(userId, weddingId, 'owner')
  await getDb()
    .delete(weddingInvites)
    .where(and(eq(weddingInvites.id, inviteId), eq(weddingInvites.weddingId, weddingId)))
}

/** Owner xoá editor; editor tự rời thiệp. Owner không tự xoá mình. */
export async function removeMember(userId: string, weddingId: string, targetUserId: string) {
  const { role } = await requireWeddingAccess(userId, weddingId)
  const leaving = targetUserId === userId
  if (leaving && role === 'owner') {
    throw new HttpError(400, 'owner_cannot_leave', 'Người tạo thiệp không thể rời thiệp')
  }
  if (!leaving && role !== 'owner') {
    throw new HttpError(403, 'forbidden', 'Chỉ người tạo thiệp mới xoá được thành viên')
  }
  await getDb()
    .delete(weddingMembers)
    .where(
      and(
        eq(weddingMembers.weddingId, weddingId),
        eq(weddingMembers.userId, targetUserId),
        eq(weddingMembers.role, 'editor'),
      ),
    )
}

export type InvitePreview =
  | { state: 'invalid' }
  | { state: 'expired' | 'used' | 'ok'; weddingId: string; groomName: string; brideName: string }

/** Thông tin hiển thị ở trang /invite/[token] */
export async function getInvitePreview(token: string): Promise<InvitePreview> {
  const [row] = await getDb()
    .select({
      weddingId: weddingInvites.weddingId,
      expiresAt: weddingInvites.expiresAt,
      acceptedAt: weddingInvites.acceptedAt,
      groom: weddings.groom,
      bride: weddings.bride,
    })
    .from(weddingInvites)
    .innerJoin(weddings, eq(weddingInvites.weddingId, weddings.id))
    .where(eq(weddingInvites.token, token))
    .limit(1)
  if (!row) return { state: 'invalid' }

  const state = row.acceptedAt ? 'used' : row.expiresAt <= new Date() ? 'expired' : 'ok'
  return {
    state,
    weddingId: row.weddingId,
    groomName: row.groom.shortName,
    brideName: row.bride.shortName,
  }
}

/** Nhận lời mời: thêm user làm editor. Trả về weddingId để chuyển tới trang sửa. */
export async function acceptInvite(userId: string, token: string) {
  return getDb().transaction(async (tx) => {
    const [invite] = await tx
      .select()
      .from(weddingInvites)
      .where(eq(weddingInvites.token, token))
      .for('update')
      .limit(1)
    if (!invite) throw new HttpError(404, 'invalid_invite', 'Link mời không đúng')

    const [existing] = await tx
      .select({ role: weddingMembers.role })
      .from(weddingMembers)
      .where(and(eq(weddingMembers.weddingId, invite.weddingId), eq(weddingMembers.userId, userId)))
      .limit(1)
    if (existing) return { weddingId: invite.weddingId }

    if (invite.acceptedAt) throw new HttpError(410, 'invite_used', 'Link mời này đã được dùng')
    if (invite.expiresAt <= new Date()) {
      throw new HttpError(410, 'invite_expired', 'Link mời đã hết hạn, hãy xin link mới')
    }

    await tx.insert(weddingMembers).values({ weddingId: invite.weddingId, userId, role: 'editor' })
    await tx
      .update(weddingInvites)
      .set({ acceptedAt: new Date(), acceptedBy: userId })
      .where(eq(weddingInvites.id, invite.id))
    return { weddingId: invite.weddingId }
  })
}
