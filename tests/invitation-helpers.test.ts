import { describe, expect, it } from 'vitest'
import {
  buildIcs,
  countdownParts,
  coupleOrder,
  eventDateParts,
  eventsForSide,
  featuredEvent,
  googleCalendarUrl,
  groupEventsBySide,
  isTemplateId,
  mapsUrl,
  monthGrid,
} from '@/lib/invitation/helpers'
import { demoInvitation } from '@/mocks/invitations'

const { events } = demoInvitation

describe('eventsForSide', () => {
  it('khách nhà gái chỉ thấy sự kiện nhà gái, theo thứ tự thời gian', () => {
    expect(eventsForSide(events, 'bride').map((e) => e.id)).toEqual(['tiec-nha-gai', 'le-vu-quy'])
  })

  it('khách nhà trai chỉ thấy sự kiện nhà trai', () => {
    expect(eventsForSide(events, 'groom').map((e) => e.id)).toEqual([
      'le-thanh-hon',
      'tiec-nha-trai',
    ])
  })

  it('sự kiện chung hiện cho cả hai bên', () => {
    const shared = { ...events[0], id: 'chung', side: 'both' as const }
    expect(eventsForSide([...events, shared], 'groom').map((e) => e.id)).toContain('chung')
  })

  it('link chung (không có khách) thấy tất cả', () => {
    expect(eventsForSide(events)).toHaveLength(4)
  })
})

describe('groupEventsBySide', () => {
  it('nhóm nhà trai trước, nhà gái sau', () => {
    const groups = groupEventsBySide(events)
    expect(groups.map((g) => g.label)).toEqual(['Nhà trai', 'Nhà gái'])
    expect(groups[1].events.map((e) => e.id)).toEqual(['tiec-nha-gai', 'le-vu-quy'])
  })
})

describe('featuredEvent', () => {
  it('khách nhà gái → Lễ Vu Quy', () => {
    expect(featuredEvent(events, 'bride')?.id).toBe('le-vu-quy')
  })

  it('khách nhà trai và link chung → Lễ Thành Hôn', () => {
    expect(featuredEvent(events, 'groom')?.id).toBe('le-thanh-hon')
    expect(featuredEvent(events)?.id).toBe('le-thanh-hon')
  })
})

describe('coupleOrder', () => {
  it('khách nhà gái thấy tên cô dâu trước', () => {
    expect(coupleOrder(demoInvitation, 'bride')[0].shortName).toBe('Ngọc Lan')
    expect(coupleOrder(demoInvitation)[0].shortName).toBe('Minh Tuấn')
  })
})

describe('eventDateParts', () => {
  it('format theo giờ Việt Nam', () => {
    expect(eventDateParts('2027-01-09T10:30:00+07:00')).toEqual({
      weekday: 'Thứ Bảy',
      day: '09',
      month: '01',
      year: '2027',
      time: '10:30',
      date: '09.01.2027',
      monthLabel: 'Tháng 1, 2027',
    })
  })

  it('giờ UTC khuya vẫn ra đúng ngày ở Việt Nam', () => {
    expect(eventDateParts('2027-01-08T20:00:00Z').date).toBe('09.01.2027')
  })
})

describe('monthGrid', () => {
  it('tháng 1/2027 bắt đầu thứ Sáu (tuần bắt đầu thứ Hai)', () => {
    const weeks = monthGrid('2027-01-09T10:30:00+07:00')
    expect(weeks[0]).toEqual([null, null, null, null, 1, 2, 3])
    expect(weeks.flat().filter(Boolean)).toHaveLength(31)
    expect(weeks.every((w) => w.length === 7)).toBe(true)
  })
})

describe('countdownParts', () => {
  it('tách ngày giờ phút giây', () => {
    const now = Date.parse('2027-01-08T09:29:30+07:00')
    expect(countdownParts('2027-01-09T10:30:00+07:00', now)).toEqual({
      days: 1,
      hours: 1,
      minutes: 0,
      seconds: 30,
      done: false,
    })
  })

  it('đã qua thì về 0', () => {
    expect(countdownParts('2020-01-01T00:00:00Z', Date.now()).done).toBe(true)
  })
})

describe('lịch và bản đồ', () => {
  const event = events.find((e) => e.id === 'le-thanh-hon')!

  it('link Google Maps tìm theo địa điểm, ưu tiên link riêng', () => {
    expect(mapsUrl(event)).toContain('google.com/maps/search/?api=1&query=')
    expect(mapsUrl({ ...event, mapUrl: 'https://maps.app.goo.gl/x' })).toBe(
      'https://maps.app.goo.gl/x',
    )
  })

  it('link Google Calendar dùng giờ UTC', () => {
    const url = new URL(googleCalendarUrl(event, demoInvitation))
    expect(url.searchParams.get('dates')).toBe('20270109T033000Z/20270109T063000Z')
    expect(url.searchParams.get('text')).toBe('Lễ Thành Hôn — Minh Tuấn & Ngọc Lan')
  })

  it('file .ics hợp lệ và escape dấu phẩy', () => {
    const ics = buildIcs(event, demoInvitation, Date.parse('2026-11-13T00:00:00Z'))
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics).toContain('DTSTART:20270109T033000Z\r\n')
    expect(ics).toContain('DTSTAMP:20261113T000000Z\r\n')
    expect(ics).toContain('LOCATION:Tư gia nhà trai\\, Số 7 phố Hàng Bè\\, Hoàn Kiếm\\, Hà Nội')
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
  })
})

describe('isTemplateId', () => {
  it('chỉ chấp nhận template có thật', () => {
    expect(isTemplateId('hoa-co')).toBe(true)
    expect(isTemplateId('khong-co')).toBe(false)
    expect(isTemplateId(undefined)).toBe(false)
  })
})
