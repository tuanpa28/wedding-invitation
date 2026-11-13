import 'server-only'
import { and, asc, count, desc, eq, min } from 'drizzle-orm'
import { LIMITS } from '@/lib/invitation/defaults'
import type { Person, Photo, TemplateId } from '@/lib/invitation/types'
import type {
  CreateWeddingInput,
  EventInput,
  GalleryPhotoInput,
  StoryItemInput,
  WeddingInfoInput,
} from '@/lib/validators/wedding'
import { getDb } from '@/server/db'
import { events, photos, storyItems, weddingMembers, weddings } from '@/server/db/schema'
import { HttpError } from '@/server/http'
import { requireWeddingAccess, type MemberRole } from '@/server/permissions'
import { refreshWedding } from '@/server/services/invitations'

export interface WeddingSummary {
  id: string
  slug: string
  status: 'draft' | 'published' | 'locked'
  templateId: TemplateId
  groomName: string
  brideName: string
  role: MemberRole
  firstEventAt: string | null
}

export interface WeddingEditData {
  id: string
  slug: string
  status: 'draft' | 'published' | 'locked'
  role: MemberRole
  templateId: TemplateId
  groom: Person
  bride: Person
  quote: string | null
  cover: Photo | null
  musicUrl: string | null
  publishedAt: string | null
  events: (EventInput & { id: string })[]
  story: StoryItemInput[]
  photos: GalleryPhotoInput[]
}

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'cause' in error &&
  (error.cause as { code?: string } | undefined)?.code === '23505'

const slugTakenError = () =>
  new HttpError(409, 'slug_taken', 'Đường dẫn này đã có người dùng, hãy chọn đường dẫn khác')

export async function isSlugAvailable(slug: string) {
  const [row] = await getDb()
    .select({ id: weddings.id })
    .from(weddings)
    .where(eq(weddings.slug, slug))
    .limit(1)
  return !row
}

/** Danh sách thiệp user được quản lý, mới nhất trước */
export async function listMyWeddings(userId: string): Promise<WeddingSummary[]> {
  const db = getDb()
  const firstEvent = db
    .select({ weddingId: events.weddingId, firstAt: min(events.startAt).as('first_at') })
    .from(events)
    .groupBy(events.weddingId)
    .as('first_event')

  const rows = await db
    .select({
      id: weddings.id,
      slug: weddings.slug,
      status: weddings.status,
      templateId: weddings.templateId,
      groom: weddings.groom,
      bride: weddings.bride,
      role: weddingMembers.role,
      firstAt: firstEvent.firstAt,
    })
    .from(weddingMembers)
    .innerJoin(weddings, eq(weddingMembers.weddingId, weddings.id))
    .leftJoin(firstEvent, eq(firstEvent.weddingId, weddings.id))
    .where(eq(weddingMembers.userId, userId))
    .orderBy(desc(weddings.createdAt))

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    status: r.status,
    templateId: r.templateId,
    groomName: r.groom.shortName,
    brideName: r.bride.shortName,
    role: r.role,
    firstEventAt: r.firstAt ? new Date(r.firstAt).toISOString() : null,
  }))
}

/** Tạo thiệp nháp; người tạo là owner */
export async function createWedding(userId: string, input: CreateWeddingInput) {
  const db = getDb()
  const [{ owned }] = await db
    .select({ owned: count() })
    .from(weddingMembers)
    .where(and(eq(weddingMembers.userId, userId), eq(weddingMembers.role, 'owner')))
  if (owned >= LIMITS.weddingsPerUser) {
    throw new HttpError(
      403,
      'limit_reached',
      `Mỗi tài khoản tạo được tối đa ${LIMITS.weddingsPerUser} thiệp`,
    )
  }
  if (!(await isSlugAvailable(input.slug))) throw slugTakenError()

  try {
    return await db.transaction(async (tx) => {
      const [wedding] = await tx
        .insert(weddings)
        .values({
          slug: input.slug,
          templateId: input.templateId,
          groom: { fullName: input.groomName, shortName: input.groomName },
          bride: { fullName: input.brideName, shortName: input.brideName },
        })
        .returning({ id: weddings.id, slug: weddings.slug })
      await tx.insert(weddingMembers).values({ weddingId: wedding.id, userId, role: 'owner' })
      return wedding
    })
  } catch (error) {
    if (isUniqueViolation(error)) throw slugTakenError()
    throw error
  }
}

/** Toàn bộ dữ liệu để sửa trong dashboard */
export async function getWeddingForEdit(
  userId: string,
  weddingId: string,
): Promise<WeddingEditData> {
  const { role } = await requireWeddingAccess(userId, weddingId)
  const row = await getDb().query.weddings.findFirst({
    where: eq(weddings.id, weddingId),
    with: {
      events: { orderBy: (e) => [asc(e.startAt), asc(e.sort)] },
      storyItems: { orderBy: (s) => [asc(s.sort)] },
      photos: { orderBy: (p) => [asc(p.sort)] },
    },
  })
  if (!row) throw new HttpError(404, 'not_found', 'Không tìm thấy thiệp')

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    role,
    templateId: row.templateId,
    groom: row.groom,
    bride: row.bride,
    quote: row.quote,
    cover: row.cover,
    musicUrl: row.musicUrl,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    events: row.events.map((e) => ({
      id: e.id,
      side: e.side,
      type: e.type,
      title: e.title,
      startAt: e.startAt.toISOString(),
      venue: e.venue,
      address: e.address,
      mapUrl: e.mapUrl ?? undefined,
      lunarText: e.lunarText ?? undefined,
    })),
    story: row.storyItems.map((s) => ({
      date: s.dateLabel,
      title: s.title,
      text: s.text,
      photo: s.photo ?? undefined,
    })),
    photos: row.photos.map((p) => ({
      src: p.src,
      width: p.width,
      height: p.height,
      alt: p.alt,
      publicId: p.publicId ?? undefined,
    })),
  }
}

/** Sửa thông tin chung. Đổi slug → xoá cache cả slug cũ lẫn mới. */
export async function updateWeddingInfo(
  userId: string,
  weddingId: string,
  patch: WeddingInfoInput,
) {
  const access = await requireWeddingAccess(userId, weddingId)
  if (Object.keys(patch).length === 0) return { slug: access.slug }
  if (patch.slug && patch.slug !== access.slug && !(await isSlugAvailable(patch.slug))) {
    throw slugTakenError()
  }

  try {
    const [updated] = await getDb()
      .update(weddings)
      .set(patch)
      .where(eq(weddings.id, weddingId))
      .returning({ slug: weddings.slug })
    refreshWedding(access.slug)
    if (updated.slug !== access.slug) refreshWedding(updated.slug)
    return updated
  } catch (error) {
    if (isUniqueViolation(error)) throw slugTakenError()
    throw error
  }
}

/** Thay toàn bộ danh sách sự kiện (form gửi cả danh sách) */
export async function replaceEvents(userId: string, weddingId: string, list: EventInput[]) {
  const { slug } = await requireWeddingAccess(userId, weddingId)
  await getDb().transaction(async (tx) => {
    await tx.delete(events).where(eq(events.weddingId, weddingId))
    if (list.length) {
      await tx.insert(events).values(
        list.map((e, sort) => ({
          weddingId,
          side: e.side,
          type: e.type,
          title: e.title,
          startAt: new Date(e.startAt),
          venue: e.venue,
          address: e.address,
          mapUrl: e.mapUrl ?? null,
          lunarText: e.lunarText ?? null,
          sort,
        })),
      )
    }
  })
  refreshWedding(slug)
}

export async function replaceStory(userId: string, weddingId: string, list: StoryItemInput[]) {
  const { slug } = await requireWeddingAccess(userId, weddingId)
  await getDb().transaction(async (tx) => {
    await tx.delete(storyItems).where(eq(storyItems.weddingId, weddingId))
    if (list.length) {
      await tx.insert(storyItems).values(
        list.map((s, sort) => ({
          weddingId,
          dateLabel: s.date,
          title: s.title,
          text: s.text,
          photo: s.photo ?? null,
          sort,
        })),
      )
    }
  })
  refreshWedding(slug)
}

export async function replacePhotos(userId: string, weddingId: string, list: GalleryPhotoInput[]) {
  const { slug } = await requireWeddingAccess(userId, weddingId)
  await getDb().transaction(async (tx) => {
    await tx.delete(photos).where(eq(photos.weddingId, weddingId))
    if (list.length) {
      await tx.insert(photos).values(
        list.map((p, sort) => ({
          weddingId,
          src: p.src,
          width: p.width,
          height: p.height,
          alt: p.alt,
          publicId: p.publicId ?? null,
          sort,
        })),
      )
    }
  })
  refreshWedding(slug)
}

/** Publish / chuyển về nháp. Publish cần ít nhất một sự kiện. */
export async function setPublished(userId: string, weddingId: string, published: boolean) {
  const { slug, status } = await requireWeddingAccess(userId, weddingId)
  if (status === 'locked') {
    throw new HttpError(423, 'locked', 'Thiệp đang bị khoá, liên hệ quản trị viên')
  }
  const db = getDb()
  if (published) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(events)
      .where(eq(events.weddingId, weddingId))
    if (total === 0) {
      throw new HttpError(422, 'needs_event', 'Thêm ít nhất một sự kiện trước khi gửi thiệp')
    }
  }
  const [updated] = await db
    .update(weddings)
    .set(
      published
        ? { status: 'published', publishedAt: new Date() }
        : { status: 'draft', publishedAt: null },
    )
    .where(eq(weddings.id, weddingId))
    .returning({ status: weddings.status, publishedAt: weddings.publishedAt })
  refreshWedding(slug)
  return { status: updated.status, publishedAt: updated.publishedAt?.toISOString() ?? null }
}

/** Xoá thiệp (chỉ owner). Ảnh trên Cloudinary chưa xoá theo — dọn ở Phase 8. */
export async function deleteWedding(userId: string, weddingId: string) {
  const { slug } = await requireWeddingAccess(userId, weddingId, 'owner')
  await getDb().delete(weddings).where(eq(weddings.id, weddingId))
  refreshWedding(slug)
}
