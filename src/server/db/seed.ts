import { inArray } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { seedWeddings, type WeddingFixture } from '../../mocks/invitations'
import * as schema from './schema'

type SeedDb = NodePgDatabase<typeof schema>

/**
 * Ghi dữ liệu thiệp mẫu vào DB. Chạy lại nhiều lần được: xoá các thiệp cùng slug trước khi ghi.
 * Không import 'server-only' để dùng được từ script (tsx) và test.
 */
export async function seed(db: SeedDb, fixtures: WeddingFixture[] = seedWeddings) {
  await db.transaction(async (tx) => {
    const slugs = fixtures.map((f) => f.invitation.slug)
    await tx.delete(schema.weddings).where(inArray(schema.weddings.slug, slugs))

    for (const { invitation, status, guests } of fixtures) {
      const [wedding] = await tx
        .insert(schema.weddings)
        .values({
          slug: invitation.slug,
          status,
          templateId: invitation.templateId,
          groom: invitation.groom,
          bride: invitation.bride,
          quote: invitation.quote ?? null,
          cover: invitation.cover,
          musicUrl: invitation.musicUrl ?? null,
          publishedAt: status === 'published' ? new Date() : null,
        })
        .returning({ id: schema.weddings.id })

      const weddingId = wedding.id

      if (invitation.events.length > 0) {
        await tx.insert(schema.events).values(
          invitation.events.map((e, sort) => ({
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

      if (invitation.story.length > 0) {
        await tx.insert(schema.storyItems).values(
          invitation.story.map((s, sort) => ({
            weddingId,
            dateLabel: s.date,
            title: s.title,
            text: s.text,
            photo: s.photo ?? null,
            sort,
          })),
        )
      }

      if (invitation.gallery.length > 0) {
        await tx
          .insert(schema.photos)
          .values(invitation.gallery.map((p, sort) => ({ weddingId, ...p, sort })))
      }

      if (guests.length > 0) {
        await tx.insert(schema.guests).values(
          guests.map((g) => ({
            weddingId,
            code: g.code,
            side: g.side,
            displayName: g.displayName,
          })),
        )
      }
    }
  })
}
