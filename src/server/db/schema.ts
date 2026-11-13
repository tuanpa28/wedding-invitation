import { relations } from 'drizzle-orm'
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
// Chỉ import kiểu (bị xoá khi build) → drizzle-kit/seed không cần alias '@/'
import type { Person, Photo, TemplateId } from '../../lib/invitation/types'

// ---------------------------------------------------------------------------
// Enum
// ---------------------------------------------------------------------------

export const weddingStatus = pgEnum('wedding_status', ['draft', 'published', 'locked'])
export const eventSide = pgEnum('event_side', ['bride', 'groom', 'both'])
export const guestSide = pgEnum('guest_side', ['bride', 'groom'])
export const eventType = pgEnum('event_type', [
  'an_hoi',
  'vu_quy',
  'thanh_hon',
  'tiec_cuoi',
  'khac',
])

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

// ---------------------------------------------------------------------------
// Bảng
// ---------------------------------------------------------------------------

/** Một thiệp cưới (một cặp đôi). Thông tin cô dâu/chú rể lưu dạng jsonb vì luôn sửa cùng nhau. */
export const weddings = pgTable('weddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  status: weddingStatus('status').notNull().default('draft'),
  templateId: text('template_id').$type<TemplateId>().notNull().default('song-hy'),
  groom: jsonb('groom').$type<Person>().notNull(),
  bride: jsonb('bride').$type<Person>().notNull(),
  quote: text('quote'),
  cover: jsonb('cover').$type<Photo>().notNull(),
  musicUrl: text('music_url'),
  /** Màu, font, bật/tắt section (Phase 7) */
  theme: jsonb('theme').$type<Record<string, unknown>>().notNull().default({}),
  /** Hạn RSVP, bật/tắt sổ lưu bút, ... (Phase 5) */
  settings: jsonb('settings').$type<Record<string, unknown>>().notNull().default({}),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  ...timestamps,
})

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    weddingId: uuid('wedding_id')
      .notNull()
      .references(() => weddings.id, { onDelete: 'cascade' }),
    side: eventSide('side').notNull(),
    type: eventType('type').notNull(),
    title: text('title').notNull(),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    venue: text('venue').notNull(),
    address: text('address').notNull(),
    mapUrl: text('map_url'),
    lunarText: text('lunar_text'),
    sort: integer('sort').notNull().default(0),
    ...timestamps,
  },
  (t) => [index('events_wedding_id_idx').on(t.weddingId)],
)

export const storyItems = pgTable(
  'story_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    weddingId: uuid('wedding_id')
      .notNull()
      .references(() => weddings.id, { onDelete: 'cascade' }),
    dateLabel: text('date_label').notNull(),
    title: text('title').notNull(),
    text: text('text').notNull(),
    photo: jsonb('photo').$type<Photo>(),
    sort: integer('sort').notNull().default(0),
    ...timestamps,
  },
  (t) => [index('story_items_wedding_id_idx').on(t.weddingId)],
)

/** Ảnh album. Từ Phase 3 thêm cloudinary_public_id khi upload thật. */
export const photos = pgTable(
  'photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    weddingId: uuid('wedding_id')
      .notNull()
      .references(() => weddings.id, { onDelete: 'cascade' }),
    src: text('src').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    alt: text('alt').notNull().default(''),
    sort: integer('sort').notNull().default(0),
    ...timestamps,
  },
  (t) => [index('photos_wedding_id_idx').on(t.weddingId)],
)

/** Khách mời: mỗi khách có mã riêng → link /{slug}/{code} */
export const guests = pgTable(
  'guests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    weddingId: uuid('wedding_id')
      .notNull()
      .references(() => weddings.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    side: guestSide('side').notNull(),
    displayName: text('display_name').notNull(),
    phone: text('phone'),
    groupTag: text('group_tag'),
    maxAttendees: integer('max_attendees'),
    firstOpenedAt: timestamp('first_opened_at', { withTimezone: true }),
    openCount: integer('open_count').notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex('guests_wedding_code_uq').on(t.weddingId, t.code)],
)

// ---------------------------------------------------------------------------
// Quan hệ (cho db.query.*.findFirst({ with: ... }))
// ---------------------------------------------------------------------------

export const weddingsRelations = relations(weddings, ({ many }) => ({
  events: many(events),
  storyItems: many(storyItems),
  photos: many(photos),
  guests: many(guests),
}))

export const eventsRelations = relations(events, ({ one }) => ({
  wedding: one(weddings, { fields: [events.weddingId], references: [weddings.id] }),
}))

export const storyItemsRelations = relations(storyItems, ({ one }) => ({
  wedding: one(weddings, { fields: [storyItems.weddingId], references: [weddings.id] }),
}))

export const photosRelations = relations(photos, ({ one }) => ({
  wedding: one(weddings, { fields: [photos.weddingId], references: [weddings.id] }),
}))

export const guestsRelations = relations(guests, ({ one }) => ({
  wedding: one(weddings, { fields: [guests.weddingId], references: [weddings.id] }),
}))
