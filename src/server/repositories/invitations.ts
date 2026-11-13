import 'server-only'
import { and, eq } from 'drizzle-orm'
import type { Guest, Invitation } from '@/lib/invitation/types'
import { getDb, type Db } from '@/server/db'
import { guests, weddings } from '@/server/db/schema'

/** Đọc thiệp đã publish theo slug (kèm sự kiện, chuyện tình, album). Thiệp nháp/khoá trả về null. */
export async function findPublishedInvitation(
  slug: string,
  db: Db = getDb(),
): Promise<Invitation | null> {
  const row = await db.query.weddings.findFirst({
    where: and(eq(weddings.slug, slug), eq(weddings.status, 'published')),
    with: {
      events: { orderBy: (e, { asc }) => [asc(e.startAt), asc(e.sort)] },
      storyItems: { orderBy: (s, { asc }) => [asc(s.sort)] },
      photos: { orderBy: (p, { asc }) => [asc(p.sort)] },
    },
  })
  if (!row) return null

  return {
    slug: row.slug,
    templateId: row.templateId,
    groom: row.groom,
    bride: row.bride,
    quote: row.quote ?? undefined,
    cover: row.cover,
    musicUrl: row.musicUrl ?? undefined,
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
    gallery: row.photos.map((p) => ({ src: p.src, width: p.width, height: p.height, alt: p.alt })),
  }
}

/** Tìm khách theo mã, chỉ trong thiệp đã publish có đúng slug */
export async function findGuest(
  slug: string,
  code: string,
  db: Db = getDb(),
): Promise<Guest | null> {
  const [row] = await db
    .select({ code: guests.code, side: guests.side, displayName: guests.displayName })
    .from(guests)
    .innerJoin(weddings, eq(guests.weddingId, weddings.id))
    .where(and(eq(weddings.slug, slug), eq(weddings.status, 'published'), eq(guests.code, code)))
    .limit(1)
  return row ?? null
}
