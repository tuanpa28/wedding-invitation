import { describe, expect, it } from 'vitest'
import { relativeTime, rsvpSchema, rsvpState, rsvpStats, wishSchema } from '@/lib/feedback'

const base = { name: 'Anh Nam', side: 'groom' as const }

describe('form RSVP', () => {
  it('đến thì ít nhất 1 người, không đến thì 0', () => {
    expect(rsvpSchema.safeParse({ ...base, attending: true, count: 2 }).success).toBe(true)
    expect(rsvpSchema.safeParse({ ...base, attending: true, count: 0 }).success).toBe(false)
    expect(rsvpSchema.safeParse({ ...base, attending: false, count: 0 }).success).toBe(true)
    expect(rsvpSchema.safeParse({ ...base, attending: false, count: 1 }).success).toBe(false)
  })

  it('thiếu tên / chưa chọn bên báo lỗi rõ ràng', () => {
    const r = rsvpSchema.safeParse({ name: ' ', attending: true, count: 1 })
    expect(r.success).toBe(false)
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(expect.arrayContaining(['name', 'side']))
  })

  it('ghi chú rỗng bị bỏ', () => {
    expect(
      rsvpSchema.parse({ ...base, attending: true, count: 1, note: '  ' }).note,
    ).toBeUndefined()
  })
})

describe('trạng thái RSVP', () => {
  const at = (iso: string) => Date.parse(iso)
  it('mặc định mở; admin tắt thì đóng', () => {
    expect(rsvpState({})).toBe('open')
    expect(rsvpState({ rsvpEnabled: false })).toBe('disabled')
  })

  it('hạn chót tính hết ngày theo giờ Việt Nam', () => {
    const inv = { rsvpDeadline: '2027-01-01' }
    expect(rsvpState(inv, at('2027-01-01T23:30:00+07:00'))).toBe('open')
    expect(rsvpState(inv, at('2027-01-02T00:00:30+07:00'))).toBe('closed')
  })
})

describe('lời chúc', () => {
  it('giới hạn độ dài', () => {
    expect(wishSchema.safeParse({ name: 'Lan', message: 'Chúc mừng!' }).success).toBe(true)
    expect(wishSchema.safeParse({ name: 'Lan', message: '   ' }).success).toBe(false)
    expect(wishSchema.safeParse({ name: 'Lan', message: 'x'.repeat(501) }).success).toBe(false)
  })

  it('giờ tương đối', () => {
    const now = Date.parse('2027-01-09T10:00:00+07:00')
    expect(relativeTime(null, now)).toBe('vừa xong')
    expect(relativeTime(new Date(now - 30_000), now)).toBe('vừa xong')
    expect(relativeTime(new Date(now - 5 * 60_000), now)).toBe('5 phút trước')
    expect(relativeTime(new Date(now - 3 * 3600_000), now)).toBe('3 giờ trước')
    expect(relativeTime(new Date(now - 2 * 86400_000), now)).toBe('2 ngày trước')
    expect(relativeTime(new Date('2026-12-01T10:00:00+07:00'), now)).toBe('01/12/2026')
  })
})

describe('thống kê RSVP', () => {
  it('đếm người đến theo bên và khách chưa phản hồi', () => {
    const stats = rsvpStats(
      [
        { guestCode: 'nam2027', side: 'groom', attending: true, count: 2 },
        { guestCode: 'cohoa27', side: 'bride', attending: false, count: 0 },
        { side: 'bride', attending: true, count: 3 }, // link chung
      ],
      ['nam2027', 'cohoa27', 'chiba', 'banduc'],
    )
    expect(stats).toEqual({
      responses: 3,
      attendingResponses: 2,
      declined: 1,
      people: 5,
      peopleBySide: { groom: 2, bride: 3 },
      pendingGuests: 2,
    })
  })
})
