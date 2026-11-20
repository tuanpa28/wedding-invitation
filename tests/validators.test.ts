import { describe, expect, it } from 'vitest'
import { demoInvitation } from '@/mocks/invitations'
import {
  eventsSchema,
  infoSchema,
  musicSchema,
  photoSchema,
  toFirestore,
} from '@/lib/validators/wedding'

describe('form thông tin', () => {
  it('ô trống tuỳ chọn bị bỏ, câu trích dẫn rỗng thành undefined', () => {
    const data = infoSchema.parse({
      groom: {
        fullName: ' Nguyễn Quang Huy ',
        shortName: 'Quang Huy',
        father: '',
        mother: 'Bà Mai',
      },
      bride: { fullName: 'Trần Thu Hà', shortName: 'Thu Hà' },
      quote: '   ',
    })
    expect(toFirestore(data)).toEqual({
      groom: { fullName: 'Nguyễn Quang Huy', shortName: 'Quang Huy', mother: 'Bà Mai' },
      bride: { fullName: 'Trần Thu Hà', shortName: 'Thu Hà' },
    })
  })

  it('thiếu tên gọi báo lỗi đúng ô', () => {
    const result = infoSchema.safeParse({
      groom: { fullName: 'A', shortName: '' },
      bride: { fullName: 'B', shortName: 'B' },
      quote: '',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['groom', 'shortName'])
  })
})

describe('sự kiện', () => {
  it('sự kiện của thiệp mẫu hợp lệ', () => {
    expect(eventsSchema.safeParse({ events: demoInvitation.events }).success).toBe(true)
  })

  it('cần ít nhất một sự kiện, giờ phải có múi giờ', () => {
    expect(eventsSchema.safeParse({ events: [] }).success).toBe(false)
    const event = { ...demoInvitation.events[0], startAt: '2027-01-09T10:30' }
    expect(eventsSchema.safeParse({ events: [event] }).success).toBe(false)
  })

  it('mỗi bên chỉ một sự kiện, tối đa 3, chỉ có Lễ Thành Hôn', () => {
    const [bride, groom, both] = demoInvitation.events
    const secondGroom = { ...groom, id: 'thanh-hon-nha-trai-2' }
    expect(eventsSchema.safeParse({ events: [bride, groom, secondGroom] }).success).toBe(false)
    expect(eventsSchema.safeParse({ events: [bride, groom, both, secondGroom] }).success).toBe(
      false,
    )
    expect(
      eventsSchema.safeParse({ events: [{ ...bride, type: 'vu_quy', title: 'Lễ Vu Quy' }] })
        .success,
    ).toBe(false)
  })
})

describe('ảnh và nhạc', () => {
  it('chỉ nhận ảnh Cloudinary hoặc ảnh mẫu', () => {
    const base = { width: 100, height: 100, alt: '' }
    expect(photoSchema.safeParse({ ...base, src: '/demo/cover.jpg' }).success).toBe(true)
    expect(
      photoSchema.safeParse({ ...base, src: 'https://res.cloudinary.com/x/image/upload/a.jpg' })
        .success,
    ).toBe(true)
    expect(photoSchema.safeParse({ ...base, src: 'https://evil.example/a.jpg' }).success).toBe(
      false,
    )
  })

  it('link nhạc phải là https, null để bỏ nhạc', () => {
    expect(musicSchema.safeParse({ musicUrl: 'http://x.example/a.mp3' }).success).toBe(false)
    expect(musicSchema.parse({ musicUrl: null })).toEqual({ musicUrl: null })
  })

  it('toFirestore giữ null (để xoá field), bỏ undefined', () => {
    expect(toFirestore({ a: undefined, b: null, c: [{ d: undefined, e: 1 }] })).toEqual({
      b: null,
      c: [{ e: 1 }],
    })
  })
})
