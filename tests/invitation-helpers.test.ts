import { describe, expect, it } from 'vitest'
import {
  countdownParts,
  coupleOrder,
  eventDateParts,
  eventsForSide,
  isTemplateId,
  mapsUrl,
  monthGrid,
} from '@/lib/invitation/helpers'
import { demoInvitation } from '@/mocks/invitations'

const { events } = demoInvitation

describe('eventsForSide', () => {
  it('khách nhà trai chỉ thấy lễ nhà trai, khách nhà gái chỉ thấy lễ nhà gái', () => {
    expect(eventsForSide(events, 'groom').map((e) => e.id)).toEqual(['thanh-hon-nha-trai'])
    expect(eventsForSide(events, 'bride').map((e) => e.id)).toEqual(['thanh-hon-nha-gai'])
  })

  it('link chung (không có khách) chỉ thấy lễ chung hai bên', () => {
    expect(eventsForSide(events).map((e) => e.id)).toEqual(['thanh-hon-chung'])
  })

  it('bên đó chưa có lễ → không có sự kiện nào', () => {
    expect(eventsForSide(events.filter((e) => e.side !== 'both'))).toEqual([])
    expect(
      eventsForSide(
        events.filter((e) => e.side !== 'groom'),
        'groom',
      ),
    ).toEqual([])
  })
})

describe('coupleOrder', () => {
  it('khách nhà gái thấy tên cô dâu trước', () => {
    expect(coupleOrder(demoInvitation, 'bride')[0].shortName).toBe('Thu Hà')
    expect(coupleOrder(demoInvitation)[0].shortName).toBe('Quang Huy')
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

describe('bản đồ', () => {
  const event = events.find((e) => e.id === 'thanh-hon-nha-trai')!

  it('link Google Maps tìm theo địa điểm, ưu tiên link riêng', () => {
    expect(mapsUrl(event)).toContain('google.com/maps/search/?api=1&query=')
    expect(mapsUrl({ ...event, mapUrl: 'https://maps.app.goo.gl/x' })).toBe(
      'https://maps.app.goo.gl/x',
    )
  })
})

describe('isTemplateId', () => {
  it('chỉ chấp nhận template có thật', () => {
    expect(isTemplateId('hoa-co')).toBe(true)
    expect(isTemplateId('khong-co')).toBe(false)
    expect(isTemplateId(undefined)).toBe(false)
  })
})
