import type { WeddingDoc, WeddingEvent } from './invitation/types'

/* ------------------------------------------------------------------ */
/* Đếm ngược tới sự kiện sắp tới                                       */
/* ------------------------------------------------------------------ */

const DAY_MS = 86_400_000
const VN_OFFSET_MS = 7 * 3_600_000

/** Số thứ tự ngày theo lịch Việt Nam (để so "hôm nay", "ngày mai" không lệch múi giờ) */
const vnDay = (ms: number) => Math.floor((ms + VN_OFFSET_MS) / DAY_MS)

export interface NextEvent {
  event: WeddingEvent
  /** Số ngày theo lịch: 0 = hôm nay, 1 = ngày mai; âm = đã qua */
  daysLeft: number
}

/** Sự kiện sắp diễn ra gần nhất (tính cả sự kiện trong hôm nay); hết rồi thì sự kiện cuối cùng */
export function nextEvent(events: WeddingEvent[], now: number): NextEvent | null {
  if (events.length === 0) return null
  const sorted = [...events].sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
  const today = vnDay(now)
  const event =
    sorted.find((e) => vnDay(Date.parse(e.startAt)) >= today) ?? sorted[sorted.length - 1]
  return { event, daysLeft: vnDay(Date.parse(event.startAt)) - today }
}

/* ------------------------------------------------------------------ */
/* Danh sách việc cần chuẩn bị                                         */
/* ------------------------------------------------------------------ */

export type ChecklistTab = 'info' | 'events' | 'design' | 'guests' | 'gifts'

export interface ChecklistItem {
  id: string
  label: string
  hint: string
  done: boolean
  tab: ChecklistTab
  /** Không bắt buộc: thiếu vẫn gửi thiệp được */
  optional?: boolean
}

export function setupChecklist(
  wedding: WeddingDoc,
  guests: { total: number; unsent: number },
): ChecklistItem[] {
  const named = (p: { shortName: string }, placeholder: string) =>
    p.shortName.trim() !== '' && p.shortName !== placeholder
  return [
    {
      id: 'couple',
      label: 'Tên cô dâu, chú rể',
      hint: 'Tên in to trên thiệp và họ tên bố mẹ hai bên',
      done: named(wedding.groom, 'Chú rể') && named(wedding.bride, 'Cô dâu'),
      tab: 'info',
    },
    {
      id: 'events',
      label: 'Lịch các buổi lễ',
      hint: 'Ngày giờ, địa điểm của từng bên',
      done: wedding.events.length > 0,
      tab: 'events',
    },
    {
      id: 'cover',
      label: 'Ảnh bìa',
      hint: 'Đang là ảnh mẫu để xem thử, cần thay bằng ảnh của hai bạn',
      done: Boolean(wedding.cover),
      tab: 'design',
    },
    {
      id: 'gallery',
      label: 'Album ảnh cưới',
      hint: 'Vài tấm ảnh cho khách xem',
      done: wedding.gallery.length > 0,
      tab: 'design',
      optional: true,
    },
    {
      id: 'music',
      label: 'Nhạc nền',
      hint: 'Phát khi khách mở thiệp',
      done: Boolean(wedding.musicUrl),
      tab: 'design',
      optional: true,
    },
    {
      id: 'gifts',
      label: 'Tài khoản mừng cưới',
      hint: 'Để khách quét QR gửi quà',
      done: Boolean(wedding.gifts?.groom || wedding.gifts?.bride),
      tab: 'gifts',
      optional: true,
    },
    {
      id: 'guests',
      label: 'Danh sách khách mời',
      hint: 'Mỗi khách có link thiệp mang tên mình',
      done: guests.total > 0,
      tab: 'guests',
    },
    {
      id: 'send',
      label: 'Gửi thiệp cho khách',
      hint: guests.total
        ? `Còn ${guests.unsent} khách chưa gửi`
        : 'Thêm khách rồi chép tin nhắn hoặc chia sẻ link',
      done: guests.total > 0 && guests.unsent === 0,
      tab: 'guests',
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Hoạt động gần đây                                                   */
/* ------------------------------------------------------------------ */

export type Activity =
  | { kind: 'open'; at: Date; name: string; count: number }
  | { kind: 'rsvp'; at: Date; name: string; attending: boolean; people: number }
  | { kind: 'wish'; at: Date; name: string; message: string }

export function recentActivity(
  data: {
    guests: { displayName: string; lastOpenedAt?: Date; openCount?: number }[]
    rsvps: { name: string; attending: boolean; count: number; updatedAt?: Date }[]
    wishes: { name: string; message: string; createdAt?: Date }[]
  },
  limit = 6,
): Activity[] {
  const items: Activity[] = []
  for (const g of data.guests) {
    if (g.lastOpenedAt) {
      items.push({ kind: 'open', at: g.lastOpenedAt, name: g.displayName, count: g.openCount ?? 1 })
    }
  }
  for (const r of data.rsvps) {
    if (r.updatedAt) {
      items.push({
        kind: 'rsvp',
        at: r.updatedAt,
        name: r.name,
        attending: r.attending,
        people: r.count,
      })
    }
  }
  for (const w of data.wishes) {
    if (w.createdAt) items.push({ kind: 'wish', at: w.createdAt, name: w.name, message: w.message })
  }
  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit)
}
