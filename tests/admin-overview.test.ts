import { describe, expect, it } from 'vitest'
import { nextEvent, recentActivity, setupChecklist } from '@/lib/admin-overview'
import type { WeddingDoc, WeddingEvent } from '@/lib/invitation/types'
import { demoInvitation } from '@/mocks/invitations'

const ev = (id: string, startAt: string) =>
  ({
    id,
    side: 'both',
    type: 'tiec_cuoi',
    title: id,
    startAt,
    venue: 'v',
    address: 'a',
  }) satisfies WeddingEvent

describe('đếm ngược trang tổng quan', () => {
  const events = [ev('a', '2027-01-08T10:00:00+07:00'), ev('b', '2027-01-10T18:00:00+07:00')]

  it('lấy sự kiện sắp tới gần nhất, tính theo ngày lịch Việt Nam', () => {
    // 23:30 ngày 07/01 giờ VN → ngày mai là 08/01
    expect(nextEvent(events, Date.parse('2027-01-07T23:30:00+07:00'))).toMatchObject({
      event: { id: 'a' },
      daysLeft: 1,
    })
    // Tối 08/01, sự kiện a đã qua giờ nhưng vẫn là "hôm nay"
    expect(nextEvent(events, Date.parse('2027-01-08T20:00:00+07:00'))).toMatchObject({
      event: { id: 'a' },
      daysLeft: 0,
    })
    expect(nextEvent(events, Date.parse('2027-01-09T08:00:00+07:00'))?.event.id).toBe('b')
  })

  it('hết sự kiện thì trả sự kiện cuối với số ngày âm; không có sự kiện thì null', () => {
    expect(nextEvent(events, Date.parse('2027-02-01T00:00:00+07:00'))).toMatchObject({
      event: { id: 'b' },
      daysLeft: -22,
    })
    expect(nextEvent([], Date.now())).toBeNull()
  })
})

const EMPTY_WEDDING: WeddingDoc = {
  templateId: 'song-hy',
  groom: { fullName: 'Chú rể', shortName: 'Chú rể' },
  bride: { fullName: 'Cô dâu', shortName: 'Cô dâu' },
  events: [],
  gallery: [],
}

describe('danh sách chuẩn bị thiệp', () => {
  it('thiệp trống: mọi mục chưa xong', () => {
    const list = setupChecklist(EMPTY_WEDDING, { total: 0, unsent: 0 })
    expect(list.every((c) => !c.done)).toBe(true)
  })

  it('thiệp mẫu có khách: các mục bắt buộc đã xong', () => {
    const { slug, ...wedding } = demoInvitation
    void slug
    const list = setupChecklist(wedding, { total: 2, unsent: 0 })
    expect(list.filter((c) => !c.optional).every((c) => c.done)).toBe(true)
    const pending = setupChecklist(wedding, { total: 2, unsent: 1 }).find((c) => c.id === 'send')
    expect(pending).toMatchObject({ done: false, hint: 'Còn 1 khách chưa gửi' })
  })
})

describe('hoạt động gần đây', () => {
  it('gộp lượt mở, phản hồi, lời chúc và xếp mới nhất trước', () => {
    const at = (h: number) => new Date(Date.UTC(2027, 0, 1, h))
    const list = recentActivity(
      {
        guests: [
          { displayName: 'Anh Nam', lastOpenedAt: at(1), openCount: 2 },
          { displayName: 'Chưa mở' },
        ],
        rsvps: [{ name: 'Cô Hoa', attending: true, count: 2, updatedAt: at(3) }],
        wishes: [{ name: 'Bạn Lan', message: 'Chúc mừng', createdAt: at(2) }],
      },
      2,
    )
    expect(list.map((a) => a.kind)).toEqual(['rsvp', 'wish'])
  })
})
