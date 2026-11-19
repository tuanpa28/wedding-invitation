import { z } from 'zod'
import type { Invitation, RsvpInput } from '@/lib/invitation/types'

// RSVP + sổ lưu bút: kiểm tra form, hạn chót, nhớ câu trả lời trên máy khách.
// Giới hạn khớp firestore.rules.

export const DEFAULT_MAX_ATTENDEES = 10

export const rsvpSchema = z
  .object({
    guestCode: z.string().optional(),
    name: z.string().trim().min(1, 'Nhập tên của bạn').max(80, 'Tối đa 80 ký tự'),
    side: z.enum(['groom', 'bride'], { message: 'Bạn là khách nhà trai hay nhà gái?' }),
    attending: z.boolean({ message: 'Chọn có đến được không' }),
    count: z.int().min(0).max(20),
    note: z
      .string()
      .trim()
      .max(300, 'Tối đa 300 ký tự')
      .optional()
      .transform((v) => v || undefined),
  })
  .refine((v) => (v.attending ? v.count >= 1 : v.count === 0), {
    message: 'Số người không hợp lệ',
    path: ['count'],
  })

export const wishSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên của bạn').max(60, 'Tối đa 60 ký tự'),
  message: z.string().trim().min(1, 'Viết đôi lời chúc nhé').max(500, 'Tối đa 500 ký tự'),
  side: z.enum(['groom', 'bride']).optional(),
  guestCode: z.string().max(32).optional(),
})

export type RsvpState = 'open' | 'closed' | 'disabled'

/**
 * Trạng thái form RSVP. Hạn chót là hết ngày `rsvpDeadline` theo giờ Việt Nam.
 */
export function rsvpState(
  invitation: Pick<Invitation, 'rsvpEnabled' | 'rsvpDeadline'>,
  now = Date.now(),
): RsvpState {
  if (invitation.rsvpEnabled === false) return 'disabled'
  if (invitation.rsvpDeadline) {
    const end = Date.parse(`${invitation.rsvpDeadline}T23:59:59+07:00`)
    if (Number.isFinite(end) && now > end) return 'closed'
  }
  return 'open'
}

/** "Thứ Sáu, 01/01/2027" — hiển thị hạn xác nhận */
export function formatDeadline(date: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(`${date}T12:00:00+07:00`))
}

/** "vừa xong", "5 phút trước", "3 giờ trước", "2 ngày trước", rồi tới ngày tháng */
export function relativeTime(date: Date | null, now = Date.now()) {
  if (!date) return 'vừa xong'
  const seconds = Math.max(0, Math.round((now - date.getTime()) / 1000))
  if (seconds < 60) return 'vừa xong'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date)
}

/* ------------------------------------------------------------------ */
/* Nhớ câu trả lời trên máy khách                                      */
/* ------------------------------------------------------------------ */

const RSVP_KEY = 'thiephong:rsvp:'
const GENERAL_ID_KEY = 'thiephong:rsvp-id'

/** Id bản ghi RSVP: link riêng = mã khách; link chung = id ngẫu nhiên nhớ trên máy */
export function rsvpIdFor(guestCode: string | undefined) {
  if (guestCode) return guestCode
  try {
    const saved = localStorage.getItem(GENERAL_ID_KEY)
    if (saved && /^[A-Za-z0-9_-]{12,40}$/.test(saved)) return saved
  } catch {
    // bỏ qua
  }
  const id = randomId()
  try {
    localStorage.setItem(GENERAL_ID_KEY, id)
  } catch {
    // bỏ qua
  }
  return id
}

export function loadSavedRsvp(id: string): RsvpInput | null {
  try {
    const raw = localStorage.getItem(RSVP_KEY + id)
    return raw ? (JSON.parse(raw) as RsvpInput) : null
  } catch {
    return null
  }
}

export function saveRsvpLocally(id: string, value: RsvpInput) {
  try {
    localStorage.setItem(RSVP_KEY + id, JSON.stringify(value))
  } catch {
    // bỏ qua
  }
}

function randomId() {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

/* ------------------------------------------------------------------ */
/* Thống kê cho trang quản lý                                          */
/* ------------------------------------------------------------------ */

export interface RsvpStats {
  responses: number
  attendingResponses: number
  declined: number
  /** Tổng số người sẽ đến */
  people: number
  peopleBySide: Record<'groom' | 'bride', number>
  /** Khách có link riêng nhưng chưa phản hồi */
  pendingGuests: number
}

export function rsvpStats(
  rsvps: Pick<RsvpInput, 'attending' | 'count' | 'side' | 'guestCode'>[],
  guestCodes: Iterable<string>,
): RsvpStats {
  const answered = new Set(rsvps.flatMap((r) => (r.guestCode ? [r.guestCode] : [])))
  let pendingGuests = 0
  for (const code of guestCodes) if (!answered.has(code)) pendingGuests++
  const attending = rsvps.filter((r) => r.attending)
  const peopleBySide = { groom: 0, bride: 0 }
  for (const r of attending) peopleBySide[r.side] += r.count
  return {
    responses: rsvps.length,
    attendingResponses: attending.length,
    declined: rsvps.length - attending.length,
    people: peopleBySide.groom + peopleBySide.bride,
    peopleBySide,
    pendingGuests,
  }
}
