import { describe, expect, it } from 'vitest'
import { safeNext } from '@/lib/auth-client'
import { isoToVnLocal, slugify, suggestSlug, vnLocalToIso } from '@/lib/invitation/slug'

describe('đường dẫn', () => {
  it('bỏ dấu tiếng Việt', () => {
    expect(slugify('Nguyễn Đức Anh')).toBe('nguyen-duc-anh')
    expect(slugify('  Bảo   Ngọc!! ')).toBe('bao-ngoc')
  })

  it('gợi ý từ tên chính (từ cuối)', () => {
    expect(suggestSlug('Minh Tuấn', 'Ngọc Lan')).toBe('tuan-lan')
    expect(suggestSlug('Đức', '')).toBe('duc')
  })
})

describe('giờ Việt Nam', () => {
  it('ô datetime-local ↔ ISO có múi giờ +07:00', () => {
    expect(vnLocalToIso('2027-01-09T10:30')).toBe('2027-01-09T10:30:00+07:00')
    expect(isoToVnLocal('2027-01-09T03:30:00.000Z')).toBe('2027-01-09T10:30')
    expect(isoToVnLocal(vnLocalToIso('2027-12-31T23:15'))).toBe('2027-12-31T23:15')
  })
})

describe('safeNext', () => {
  it('chỉ cho quay về đường dẫn nội bộ', () => {
    expect(safeNext('/dashboard/abc')).toBe('/dashboard/abc')
    expect(safeNext('https://evil.example')).toBe('/dashboard')
    expect(safeNext('//evil.example')).toBe('/dashboard')
    expect(safeNext('/\\evil.example')).toBe('/dashboard')
    expect(safeNext(undefined)).toBe('/dashboard')
  })
})
