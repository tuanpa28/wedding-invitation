import { describe, expect, it } from 'vitest'
import { DEFAULT_COVER } from '@/lib/invitation/defaults'
import { prerenderStamp, staleParts } from '@/lib/prerender'
import { demoInvitation } from '@/mocks/invitations'

const { slug, cover, ...wedding } = demoInvitation
void slug

describe('nhắc deploy lại khi bản dựng sẵn đã cũ', () => {
  const built = prerenderStamp({ ...wedding, cover })

  it('nội dung không đổi các phần quan trọng thì không cần deploy', () => {
    expect(staleParts(built, { ...wedding, cover, quote: 'câu khác' } as typeof wedding)).toEqual(
      [],
    )
  })

  it('liệt kê đúng phần đã đổi', () => {
    expect(
      staleParts(built, {
        ...wedding,
        templateId: wedding.templateId === 'nga' ? 'hoa-co' : 'nga',
        cover: { ...cover, src: 'https://res.cloudinary.com/x/anh-moi.jpg' },
        groom: { ...wedding.groom, shortName: 'Tên mới' },
      }),
    ).toEqual(['mẫu thiệp', 'ảnh bìa', 'tên cô dâu, chú rể'])
  })

  it('đổi ngày sự kiện sớm nhất → ngày cưới trên ảnh chia sẻ đã cũ', () => {
    const events = wedding.events.map((e) => ({ ...e, startAt: '2030-05-05T10:00:00+07:00' }))
    expect(staleParts(built, { ...wedding, cover, events })).toEqual(['ngày cưới'])
  })

  it('chưa có ảnh bìa = ảnh mặc định; mã mẫu cũ = Song Hỷ', () => {
    const noCover = prerenderStamp({ ...wedding, templateId: 'thanh-lich' as never })
    expect(noCover.coverSrc).toBe(DEFAULT_COVER.src)
    expect(noCover.templateId).toBe('song-hy')
  })
})
