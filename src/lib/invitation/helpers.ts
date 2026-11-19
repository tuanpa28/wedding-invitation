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

/** Sự kiện khách được thấy: khách một bên chỉ thấy sự kiện bên đó + sự kiện chung. */
export function eventsForSide(events: WeddingEvent[], side?: Side): WeddingEvent[] {
  const visible = side ? events.filter((e) => e.side === side || e.side === 'both') : events
  return [...visible].sort(byStart)
}

/** Nhóm sự kiện theo bên (dùng cho link chung không có tên khách). Nhà trai trước, nhà gái sau. */
export function groupEventsBySide(events: WeddingEvent[]) {
  const order: EventSide[] = ['groom', 'bride', 'both']
  return order
    .map((side) => ({
      side,
      label: SIDE_LABEL[side],
      events: events.filter((e) => e.side === side).sort(byStart),
    }))
    .filter((group) => group.events.length > 0)
}

/** Sự kiện chính để đếm ngược và in ngày lớn: ưu tiên lễ của bên khách, sau đó Lễ Thành Hôn. */
export function featuredEvent(events: WeddingEvent[], side?: Side): WeddingEvent | undefined {
  const sorted = [...events].sort(byStart)
  const priority =
    side === 'bride' ? ['vu_quy', 'tiec_cuoi', 'thanh_hon'] : ['thanh_hon', 'vu_quy', 'tiec_cuoi']
  for (const type of priority) {
    const found = sorted.find(
      (e) => e.type === type && (!side || e.side === side || e.side === 'both'),
    )
    if (found) return found
  }
  return sorted[0]
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

/** Sự kiện cưới mặc định kéo dài 3 tiếng (dùng cho lịch) */
const EVENT_DURATION_MS = 3 * 60 * 60 * 1000

/** 2027-01-09T03:30:00.000Z → 20270109T033000Z */
function toCalendarUtc(ms: number) {
  return new Date(ms)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

/** Thông tin tối thiểu để tạo sự kiện lịch (truyền được xuống client component) */
export type CalendarCouple = {
  slug: string
  groom: Pick<Person, 'shortName'>
  bride: Pick<Person, 'shortName'>
}

function calendarTitle(event: WeddingEvent, invitation: CalendarCouple) {
  return `${event.title} — ${invitation.groom.shortName} & ${invitation.bride.shortName}`
}

export function googleCalendarUrl(event: WeddingEvent, invitation: CalendarCouple) {
  const start = Date.parse(event.startAt)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: calendarTitle(event, invitation),
    dates: `${toCalendarUtc(start)}/${toCalendarUtc(start + EVENT_DURATION_MS)}`,
    location: `${event.venue}, ${event.address}`,
    details: 'Thiệp mời từ Thiệp Hồng',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Escape ký tự đặc biệt theo RFC 5545 */
function escapeIcs(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Nội dung file .ics để lưu sự kiện vào lịch (Apple Calendar, Outlook, ...) */
export function buildIcs(event: WeddingEvent, invitation: CalendarCouple, nowMs: number) {
  const start = Date.parse(event.startAt)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Thiep Hong//Thiep cuoi//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@${invitation.slug}.thiephong`,
    `DTSTAMP:${toCalendarUtc(nowMs)}`,
    `DTSTART:${toCalendarUtc(start)}`,
    `DTEND:${toCalendarUtc(start + EVENT_DURATION_MS)}`,
    `SUMMARY:${escapeIcs(calendarTitle(event, invitation))}`,
    `LOCATION:${escapeIcs(`${event.venue}, ${event.address}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n') + '\r\n'
}

/**
 * Sự kiện chính cho link chung (không có tên khách): sự kiện chung hai bên sớm nhất,
 * không có thì tiệc cưới sớm nhất, không có nữa thì sự kiện sớm nhất.
 * Link chung chỉ mời chung chung; lịch từng bên (vu quy, thành hôn tại nhà) chỉ có trong link riêng.
 */
export function mainEvent(events: WeddingEvent[]): WeddingEvent | undefined {
  const sorted = [...events].sort(byStart)
  return (
    sorted.find((e) => e.side === 'both') ?? sorted.find((e) => e.type === 'tiec_cuoi') ?? sorted[0]
  )
}
