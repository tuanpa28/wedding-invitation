import type { EventSide, Guest, Invitation, Person, Side, TemplateId, WeddingEvent } from './types'
import { TEMPLATE_IDS } from './types'

export const WEDDING_TIME_ZONE = 'Asia/Ho_Chi_Minh'

export const SIDE_LABEL: Record<EventSide, string> = {
  bride: 'Nhà gái',
  groom: 'Nhà trai',
  both: 'Hai họ',
}

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && (TEMPLATE_IDS as readonly string[]).includes(value)
}

const byStart = (a: WeddingEvent, b: WeddingEvent) => Date.parse(a.startAt) - Date.parse(b.startAt)

/**
 * Sự kiện khách được thấy (tối đa một): link riêng chỉ thấy lễ của bên mình (nhà trai / nhà gái),
 * link chung (không có `side`) chỉ thấy lễ chung hai bên. Bên đó chưa có lễ → mảng rỗng.
 */
export function eventsForSide(events: WeddingEvent[], side?: Side): WeddingEvent[] {
  const wanted: EventSide = side ?? 'both'
  return events.filter((e) => e.side === wanted).sort(byStart)
}

/** Thứ tự tên trên thiệp: khách nhà gái thấy tên cô dâu trước, còn lại chú rể trước. */
export function coupleOrder(invitation: Invitation, side?: Side): [Person, Person] {
  return side === 'bride'
    ? [invitation.bride, invitation.groom]
    : [invitation.groom, invitation.bride]
}

export function inviteeName(guest?: Guest) {
  return guest?.displayName ?? 'Quý khách'
}

/** Tên khách khi đứng giữa câu: "Anh Nam" → "anh Nam" (giữ hoa tên riêng) */
export function inviteeInSentence(guest?: Guest) {
  const name = inviteeName(guest)
  return name.charAt(0).toLowerCase() + name.slice(1)
}

export interface EventDateParts {
  weekday: string
  day: string
  month: string
  year: string
  time: string
  /** "09.01.2027" */
  date: string
  /** "Tháng 1, 2027" */
  monthLabel: string
}

/** Tách ngày giờ sự kiện theo giờ Việt Nam (không phụ thuộc múi giờ máy khách). */
export function eventDateParts(iso: string): EventDateParts {
  const d = new Date(iso)
  const get = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('vi-VN', { timeZone: WEDDING_TIME_ZONE, ...options }).format(d)

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: WEDDING_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''

  const weekday = get({ weekday: 'long' })
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    day: pick('day'),
    month: pick('month'),
    year: pick('year'),
    time: `${pick('hour')}:${pick('minute')}`,
    date: `${pick('day')}.${pick('month')}.${pick('year')}`,
    monthLabel: `Tháng ${Number(pick('month'))}, ${pick('year')}`,
  }
}

/** Lưới lịch của tháng chứa ngày cưới, tuần bắt đầu từ thứ Hai. Ô trống là null. */
export function monthGrid(iso: string): (number | null)[][] {
  const { year, month } = eventDateParts(iso)
  const y = Number(year)
  const m = Number(month)
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay() // 0 = CN
  const lead = (firstWeekday + 6) % 7 // số ô trống trước ngày 1 khi tuần bắt đầu thứ Hai
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()

  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

export function countdownParts(targetIso: string, nowMs: number): CountdownParts {
  const diff = Math.max(0, Date.parse(targetIso) - nowMs)
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    done: diff === 0,
  }
}

export function mapsUrl(event: WeddingEvent) {
  if (event.mapUrl) return event.mapUrl
  const query = encodeURIComponent(`${event.venue}, ${event.address}`)
  return `https://www.google.com/maps/search/?api=1&query=${query}`
}
