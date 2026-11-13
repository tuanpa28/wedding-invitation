import { revalidateTag } from 'next/cache'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST as revalidate } from '@/app/api/revalidate/route'
import { isValidGuestCode, isValidSlug } from '@/lib/invitation/validation'
import { anhThuInvitation, demoInvitation } from '@/mocks/invitations'
import { findGuest, findPublishedInvitation } from '@/server/repositories/invitations'
import { getGuest, getInvitation } from '@/server/services/invitations'

// Database test được seed sẵn trong tests/global-setup.ts (demo, anh-thu đã publish; ban-nhap là nháp)

describe('findPublishedInvitation', () => {
  it('đọc đủ thiệp demo từ DB, khớp dữ liệu mẫu', async () => {
    const invitation = await findPublishedInvitation('demo')
    expect(invitation).not.toBeNull()
    expect(invitation!.templateId).toBe('song-hy')
    expect(invitation!.groom).toEqual(demoInvitation.groom)
    expect(invitation!.bride).toEqual(demoInvitation.bride)
    expect(invitation!.cover).toEqual(demoInvitation.cover)
    expect(invitation!.musicUrl).toBe(demoInvitation.musicUrl)
    expect(invitation!.story.map((s) => s.title)).toEqual(demoInvitation.story.map((s) => s.title))
    expect(invitation!.gallery).toEqual(demoInvitation.gallery)
  })

  it('sự kiện được sắp theo thời gian, giữ đúng giờ', async () => {
    const invitation = await findPublishedInvitation('demo')
    const times = invitation!.events.map((e) => Date.parse(e.startAt))
    expect(times).toEqual([...times].sort((a, b) => a - b))

    const expected = [...demoInvitation.events]
      .sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))
      .map((e) => ({ title: e.title, side: e.side, at: Date.parse(e.startAt) }))
    expect(
      invitation!.events.map((e) => ({ title: e.title, side: e.side, at: Date.parse(e.startAt) })),
    ).toEqual(expected)
  })

  it('thiệp thứ hai độc lập, không có nhạc', async () => {
    const invitation = await findPublishedInvitation('anh-thu')
    expect(invitation!.templateId).toBe('hoa-co')
    expect(invitation!.groom.shortName).toBe(anhThuInvitation.groom.shortName)
    expect(invitation!.events).toHaveLength(4)
    expect(invitation!.musicUrl).toBeUndefined()
  })

  it('thiệp nháp và slug không tồn tại trả về null', async () => {
    expect(await findPublishedInvitation('ban-nhap')).toBeNull()
    expect(await findPublishedInvitation('khong-ton-tai')).toBeNull()
  })
})

describe('findGuest', () => {
  it('tìm đúng khách của thiệp', async () => {
    expect(await findGuest('demo', 'nam2027')).toEqual({
      code: 'nam2027',
      side: 'groom',
      displayName: 'Anh Nam',
    })
  })

  it('mã khách của thiệp khác không dùng được', async () => {
    expect(await findGuest('demo', 'chimai')).toBeNull()
    expect(await findGuest('anh-thu', 'chimai')).not.toBeNull()
  })

  it('khách của thiệp nháp không xem được', async () => {
    expect(await findGuest('ban-nhap', 'khach1')).toBeNull()
  })
})

describe('service có cache', () => {
  it('trả dữ liệu như repository', async () => {
    expect((await getInvitation('demo'))?.slug).toBe('demo')
    expect((await getGuest('anh-thu', 'banduc'))?.side).toBe('groom')
  })

  it('slug/mã sai định dạng trả null', async () => {
    expect(await getInvitation('Demo Có Dấu')).toBeNull()
    expect(await getGuest('demo', '<script>')).toBeNull()
  })
})

describe('validation', () => {
  it('slug hợp lệ', () => {
    expect(isValidSlug('tuan-lan')).toBe(true)
    expect(isValidSlug('anh-thu-2027')).toBe(true)
  })

  it('slug không hợp lệ', () => {
    for (const slug of [
      'ab',
      '-tuan',
      'tuan-',
      'tuan--lan',
      'Tuan',
      'tuấn',
      'api',
      'dashboard',
      'a'.repeat(61),
    ]) {
      expect(isValidSlug(slug), slug).toBe(false)
    }
  })

  it('mã khách', () => {
    expect(isValidGuestCode('nam2027')).toBe(true)
    expect(isValidGuestCode('a8Kx_2-pQ')).toBe(true)
    expect(isValidGuestCode('ab')).toBe(false)
    expect(isValidGuestCode('có dấu')).toBe(false)
  })
})

describe('POST /api/revalidate', () => {
  afterEach(() => vi.mocked(revalidateTag).mockClear())

  const call = (body: unknown, auth?: string) =>
    revalidate(
      new Request('http://localhost/api/revalidate', {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(auth ? { authorization: auth } : {}) },
        body: JSON.stringify(body),
      }),
    )

  it('từ chối khi thiếu hoặc sai khoá', async () => {
    expect((await call({ slug: 'demo' })).status).toBe(401)
    expect((await call({ slug: 'demo' }, 'Bearer sai-khoa')).status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('báo lỗi khi thiếu slug', async () => {
    expect((await call({}, 'Bearer test-secret')).status).toBe(400)
  })

  it('xoá cache đúng tag của thiệp, không phục vụ dữ liệu cũ', async () => {
    const res = await call({ slug: 'demo' }, 'Bearer test-secret')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ revalidated: true, slug: 'demo' })
    expect(revalidateTag).toHaveBeenCalledWith('wedding:demo', { expire: 0 })
  })
})
