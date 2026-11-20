import { describe, expect, it } from 'vitest'
import {
  generateGuestCode,
  GUEST_CODE_LENGTH,
  guestLink,
  inviteMessage,
  parseGuestRows,
  parseSide,
} from '@/lib/guests'
import { isValidGuestCode } from '@/lib/invitation/validation'

/** Nguồn ngẫu nhiên lặp lại được cho test */
const seq = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]
}

describe('mã link khách', () => {
  it('đủ độ dài, hợp lệ, không có ký tự dễ nhầm', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateGuestCode(new Set())
      expect(code).toHaveLength(GUEST_CODE_LENGTH)
      expect(isValidGuestCode(code)).toBe(true)
      expect(code).not.toMatch(/[01lIoO]/)
    }
  })

  it('không trùng mã đã có', () => {
    const random = seq(0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5)
    expect(generateGuestCode(new Set(['aaaaaa']), random)).not.toBe('aaaaaa')
  })
})

describe('đọc file Excel', () => {
  it('nhận tiêu đề có dấu/không dấu, chuẩn hoá bên, bỏ dòng trống', () => {
    const { guests, errors } = parseGuestRows(
      [
        ['Tên gọi', 'Bên', 'Nhóm', 'Số người'],
        ['Anh Nam', 'Nhà trai', 'Bạn đại học', 2],
        ['Cô Hoa và gia đình', 'nha gai', null, null],
        [null, null, null, null],
        ['  Chị Mai  ', 'Gái', 'Đồng nghiệp', '1'],
      ],
      new Set(),
    )
    expect(errors).toEqual([])
    expect(
      guests.map((g) => ({
        displayName: g.displayName,
        side: g.side,
        group: g.group,
        maxAttendees: g.maxAttendees,
      })),
    ).toEqual([
      { displayName: 'Anh Nam', side: 'groom', group: 'Bạn đại học', maxAttendees: 2 },
      {
        displayName: 'Cô Hoa và gia đình',
        side: 'bride',
        group: undefined,
        maxAttendees: undefined,
      },
      { displayName: 'Chị Mai', side: 'bride', group: 'Đồng nghiệp', maxAttendees: 1 },
    ])
    expect(new Set(guests.map((g) => g.code)).size).toBe(3)
  })

  it('báo lỗi đúng dòng, vẫn nhận các dòng đúng', () => {
    const { guests, errors } = parseGuestRows(
      [
        ['ten', 'ben', 'so nguoi'],
        ['Anh Nam', 'Nhà trai', 2],
        ['Chú Ba', 'hàng xóm', 1],
        ['', 'Nhà gái', 1],
        ['Bác Tư', 'Nhà gái', 50],
      ],
      new Set(),
    )
    expect(guests).toHaveLength(1)
    expect(errors.map((e) => e.row)).toEqual([3, 4, 5])
  })

  it('giữ mã có sẵn trong file nếu hợp lệ và chưa dùng', () => {
    const { guests } = parseGuestRows(
      [
        ['Mã', 'Tên gọi', 'Bên'],
        ['nam2027', 'Anh Nam', 'Nhà trai'],
        ['dacodung', 'Chị Lan', 'Nhà gái'],
        ['có dấu', 'Cô Hoa', 'Nhà gái'],
      ],
      new Set(['dacodung']),
    )
    expect(guests[0].code).toBe('nam2027')
    expect(guests[1].code).not.toBe('dacodung')
    expect(isValidGuestCode(guests[2].code)).toBe(true)
  })

  it('thiếu cột bắt buộc', () => {
    expect(parseGuestRows([['Họ', 'Tuổi']], new Set()).errors[0].message).toMatch(/Tên gọi/)
  })

  it('50 khách', () => {
    const rows = [
      ['Tên gọi', 'Bên'],
      ...Array.from({ length: 50 }, (_, i) => [`Khách ${i + 1}`, i % 2 ? 'Nhà gái' : 'Nhà trai']),
    ]
    const { guests, errors } = parseGuestRows(rows, new Set())
    expect(errors).toEqual([])
    expect(guests).toHaveLength(50)
    expect(new Set(guests.map((g) => g.code)).size).toBe(50)
  })
})

describe('link và tin nhắn', () => {
  it('parseSide', () => {
    expect(parseSide('NHÀ TRAI')).toBe('groom')
    expect(parseSide('cô dâu')).toBe('bride')
    expect(parseSide('khác')).toBeNull()
  })

  it('tin nhắn thay đủ chỗ trống', () => {
    const link = guestLink('https://thiep.web.app/', 'abc234')
    expect(link).toBe('https://thiep.web.app/m/abc234')
    expect(
      inviteMessage('Mời {ten} dự cưới {chu_re} & {co_dau}: {link} — {ten}', {
        name: 'Anh Nam',
        link,
        groom: 'Quang Huy',
        bride: 'Thu Hà',
      }),
    ).toBe('Mời Anh Nam dự cưới Quang Huy & Thu Hà: https://thiep.web.app/m/abc234 — Anh Nam')
  })
})
