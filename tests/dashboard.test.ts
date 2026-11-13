import { revalidateTag } from 'next/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LIMITS } from '@/lib/invitation/defaults'
import { createWeddingSchema } from '@/lib/validators/wedding'
import { findInvitationById, findPublishedInvitation } from '@/server/repositories/invitations'
import {
  acceptInvite,
  createInvite,
  getInvitePreview,
  listMembers,
  removeMember,
} from '@/server/services/members'
import {
  createWedding,
  deleteWedding,
  getWeddingForEdit,
  listMyWeddings,
  replaceEvents,
  replacePhotos,
  setPublished,
  updateWeddingInfo,
} from '@/server/services/weddings'
import { createUser, errorOf, randomSlug, sampleEvent } from './helpers'

const newWedding = (slug = randomSlug()) => ({
  groomName: 'Đức Anh',
  brideName: 'Bảo Ngọc',
  slug,
  templateId: 'hoa-co' as const,
})

beforeEach(() => vi.mocked(revalidateTag).mockClear())

describe('tạo thiệp', () => {
  it('người tạo là owner, thiệp bắt đầu là bản nháp', async () => {
    const a = await createUser()
    const { id, slug } = await createWedding(a.id, newWedding())

    const list = await listMyWeddings(a.id)
    expect(list).toEqual([
      expect.objectContaining({ id, slug, status: 'draft', role: 'owner', groomName: 'Đức Anh' }),
    ])
    // Bản nháp chưa ai xem được qua link công khai
    expect(await findPublishedInvitation(slug)).toBeNull()
  })

  it('đường dẫn đã có người dùng → 409', async () => {
    const a = await createUser()
    const b = await createUser()
    const slug = randomSlug()
    await createWedding(a.id, newWedding(slug))
    expect(await errorOf(createWedding(b.id, newWedding(slug)))).toMatchObject({
      status: 409,
      code: 'slug_taken',
    })
    // Slug của thiệp mẫu cũng không lấy được
    expect(await errorOf(createWedding(b.id, newWedding('demo')))).toMatchObject({ status: 409 })
  })

  it('đường dẫn hệ thống bị chặn ngay ở validator', () => {
    for (const slug of ['dashboard', 'invite', 'api', 'Có Dấu']) {
      expect(createWeddingSchema.safeParse(newWedding(slug)).success, slug).toBe(false)
    }
    // Chữ hoa được đổi thành chữ thường
    expect(createWeddingSchema.parse(newWedding('Tuan-Lan')).slug).toBe('tuan-lan')
  })

  it(`mỗi tài khoản tối đa ${LIMITS.weddingsPerUser} thiệp`, async () => {
    const a = await createUser()
    for (let i = 0; i < LIMITS.weddingsPerUser; i++) await createWedding(a.id, newWedding())
    expect(await errorOf(createWedding(a.id, newWedding()))).toMatchObject({
      status: 403,
      code: 'limit_reached',
    })
  })
})

describe('phân quyền: user B không đụng được thiệp của user A', () => {
  it('mọi thao tác của người ngoài đều trả 404', async () => {
    const a = await createUser('A')
    const b = await createUser('B')
    const { id } = await createWedding(a.id, newWedding())

    const attempts = [
      () => getWeddingForEdit(b.id, id),
      () => updateWeddingInfo(b.id, id, { quote: 'Bị sửa trộm' }),
      () => replaceEvents(b.id, id, [sampleEvent]),
      () => replacePhotos(b.id, id, []),
      () => setPublished(b.id, id, true),
      () => deleteWedding(b.id, id),
      () => listMembers(b.id, id),
      () => createInvite(b.id, id),
    ]
    for (const attempt of attempts) {
      expect(await errorOf(attempt())).toMatchObject({ status: 404, code: 'not_found' })
    }

    // Dữ liệu của A không đổi
    const wedding = await getWeddingForEdit(a.id, id)
    expect(wedding.quote).toBeNull()
    expect(wedding.events).toEqual([])
    expect(await listMyWeddings(b.id)).toEqual([])
  })

  it('id không phải uuid cũng trả 404, không lỗi DB', async () => {
    const a = await createUser()
    expect(await errorOf(getWeddingForEdit(a.id, 'khong-phai-uuid'))).toMatchObject({
      status: 404,
    })
  })
})

describe('sửa và gửi thiệp', () => {
  it('chưa có sự kiện thì không gửi được', async () => {
    const a = await createUser()
    const { id } = await createWedding(a.id, newWedding())
    expect(await errorOf(setPublished(a.id, id, true))).toMatchObject({
      status: 422,
      code: 'needs_event',
    })
  })

  it('thêm sự kiện, gửi thiệp → link công khai mở được và cache được xoá', async () => {
    const a = await createUser()
    const { id, slug } = await createWedding(a.id, newWedding())
    await replaceEvents(a.id, id, [sampleEvent])
    expect(revalidateTag).toHaveBeenCalledWith(`wedding:${slug}`, { expire: 0 })

    const result = await setPublished(a.id, id, true)
    expect(result.status).toBe('published')
    expect(result.publishedAt).not.toBeNull()

    const invitation = await findPublishedInvitation(slug)
    expect(invitation?.events).toHaveLength(1)
    expect(Date.parse(invitation!.events[0].startAt)).toBe(Date.parse(sampleEvent.startAt))
    // Chưa tải ảnh bìa → dùng ảnh mặc định
    expect(invitation?.cover.src).toBe('/demo/cover.jpg')

    await setPublished(a.id, id, false)
    expect(await findPublishedInvitation(slug)).toBeNull()
  })

  it('đổi đường dẫn xoá cache cả đường dẫn cũ lẫn mới', async () => {
    const a = await createUser()
    const { id, slug } = await createWedding(a.id, newWedding())
    const next = randomSlug('moi')
    await updateWeddingInfo(a.id, id, { slug: next, quote: 'Trăm năm hạnh phúc' })

    expect(revalidateTag).toHaveBeenCalledWith(`wedding:${slug}`, { expire: 0 })
    expect(revalidateTag).toHaveBeenCalledWith(`wedding:${next}`, { expire: 0 })
    const wedding = await getWeddingForEdit(a.id, id)
    expect(wedding).toMatchObject({ slug: next, quote: 'Trăm năm hạnh phúc' })
  })

  it('thay album giữ đúng thứ tự', async () => {
    const a = await createUser()
    const { id } = await createWedding(a.id, newWedding())
    const photo = (n: number) => ({ src: `/demo/g-0${n}.jpg`, width: 960, height: 640, alt: '' })
    await replacePhotos(a.id, id, [photo(3), photo(1), photo(2)])
    const invitation = await findInvitationById(id)
    expect(invitation?.gallery.map((p) => p.src)).toEqual([
      '/demo/g-03.jpg',
      '/demo/g-01.jpg',
      '/demo/g-02.jpg',
    ])
  })

  it('chỉ owner xoá được thiệp', async () => {
    const a = await createUser()
    const { id } = await createWedding(a.id, newWedding())
    await deleteWedding(a.id, id)
    expect(await listMyWeddings(a.id)).toEqual([])
  })
})

describe('mời đồng quản lý', () => {
  it('B nhận lời mời → sửa được thiệp nhưng không xoá / mời thêm được', async () => {
    const a = await createUser('A')
    const b = await createUser('B')
    const { id } = await createWedding(a.id, newWedding())

    const invite = await createInvite(a.id, id)
    expect(await getInvitePreview(invite.token)).toMatchObject({
      state: 'ok',
      groomName: 'Đức Anh',
    })
    expect(await acceptInvite(b.id, invite.token)).toEqual({ weddingId: id })

    // B là editor
    expect((await getWeddingForEdit(b.id, id)).role).toBe('editor')
    await updateWeddingInfo(b.id, id, { quote: 'B sửa được' })
    expect(await errorOf(deleteWedding(b.id, id))).toMatchObject({ status: 403 })
    expect(await errorOf(createInvite(b.id, id))).toMatchObject({ status: 403 })

    // Link đã dùng: người thứ ba không dùng lại được
    const c = await createUser('C')
    expect(await errorOf(acceptInvite(c.id, invite.token))).toMatchObject({
      status: 410,
      code: 'invite_used',
    })
    expect(await getInvitePreview(invite.token)).toMatchObject({ state: 'used' })
    // B bấm lại link của chính mình: không lỗi
    expect(await acceptInvite(b.id, invite.token)).toEqual({ weddingId: id })

    const { members, invites } = await listMembers(a.id, id)
    expect(members.map((m) => [m.name, m.role])).toEqual([
      ['A', 'owner'],
      ['B', 'editor'],
    ])
    expect(invites).toEqual([])
  })

  it('link sai trả 404, editor tự rời được, owner không rời được', async () => {
    const a = await createUser()
    const b = await createUser()
    const { id } = await createWedding(a.id, newWedding())
    expect(await errorOf(acceptInvite(b.id, 'khong-co-link-nay'))).toMatchObject({ status: 404 })

    const invite = await createInvite(a.id, id)
    await acceptInvite(b.id, invite.token)
    await removeMember(b.id, id, b.id)
    expect(await errorOf(getWeddingForEdit(b.id, id))).toMatchObject({ status: 404 })
    expect(await errorOf(removeMember(a.id, id, a.id))).toMatchObject({
      status: 400,
      code: 'owner_cannot_leave',
    })
  })

  it(`tối đa ${LIMITS.membersPerWedding} người quản lý tính cả link chưa dùng`, async () => {
    const a = await createUser()
    const { id } = await createWedding(a.id, newWedding())
    for (let i = 1; i < LIMITS.membersPerWedding; i++) await createInvite(a.id, id)
    expect(await errorOf(createInvite(a.id, id))).toMatchObject({ status: 403 })
  })
})
