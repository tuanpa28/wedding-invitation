// Đọc/ghi thẳng Firestore Emulator từ test (Admin SDK, bỏ qua Security Rules): dựng tình huống
// giống như admin vừa lưu trong trang quản lý, rồi kiểm tra thiệp hiển thị đúng.
import { getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import type { WeddingEvent } from '../src/lib/invitation/types'

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8085'

const app = getApps()[0] ?? initializeApp({ projectId: 'demo-thiephong' })
export const db = getFirestore(app)
export { FieldValue }

export const TEMPLATES = ['song-hy', 'nga', 'hoa-co'] as const
export type TemplateId = (typeof TEMPLATES)[number]

/** Chữ chỉ có ở từng mẫu (để biết thiệp đang hiện đúng mẫu admin chọn) */
export const TEMPLATE_MARK: Record<TemplateId, string> = {
  'song-hy': 'Thư mời cưới',
  nga: 'Wedding Invitation',
  'hoa-co': 'Ngày chung đôi',
}

const event = (e: Partial<WeddingEvent> & Pick<WeddingEvent, 'id' | 'side' | 'title'>) => ({
  type: 'tiec_cuoi',
  startAt: '2030-05-05T11:00:00+07:00',
  venue: 'Nhà hàng Kiểm Thử',
  address: '1 Đường Thử, Hà Nội',
  ...e,
})

/** Nội dung thiệp "như admin vừa nhập" — chữ riêng biệt để dễ tìm trên trang */
export const ADMIN_CONTENT = {
  groom: {
    shortName: 'Hoàng Minh',
    fullName: 'Lê Hoàng Minh',
    title: 'Thứ nam',
    father: 'Ông Lê Văn Cha',
    mother: 'Bà Đỗ Thị Mẹ',
    address: '9 Phố Nhà Trai, Hà Nội',
  },
  bride: {
    shortName: 'Thu Trang',
    fullName: 'Phạm Thu Trang',
    title: 'Trưởng nữ',
    father: 'Ông Phạm Văn Bố',
    mother: 'Bà Vũ Thị Má',
    address: '5 Phố Nhà Gái, Hải Phòng',
  },
  quote: 'Câu trích dẫn do admin nhập',
  events: [
    event({
      id: 'ruoc-dau',
      side: 'groom',
      type: 'thanh_hon',
      title: 'Lễ Rước Dâu Thử',
      startAt: '2030-05-04T09:00:00+07:00',
      venue: 'Tư gia nhà trai thử',
      mapUrl: 'https://maps.app.goo.gl/nhaTraiThu',
    }),
    event({
      id: 'vu-quy',
      side: 'bride',
      type: 'vu_quy',
      title: 'Lễ Vu Quy Thử',
      startAt: '2030-05-04T07:00:00+07:00',
      venue: 'Tư gia nhà gái thử',
    }),
    event({
      id: 'tiec-chung',
      side: 'both',
      title: 'Tiệc Cưới Chung Thử',
      lunarText: 'Tức ngày âm thử',
    }),
  ],
  gifts: {
    groom: { bankBin: '970436', accountNumber: '1111222233', accountName: 'LE HOANG MINH' },
    bride: { bankBin: '970418', accountNumber: '4444555566', accountName: 'PHAM THU TRANG' },
  },
}

export const wedding = () => db.doc('site/wedding')
export const setWedding = (data: Record<string, unknown>) => wedding().update(data)
export const guest = (code: string) => db.doc(`guests/${code}`)

export async function guestOpenCount(code: string) {
  return ((await guest(code).get()).data()?.openCount as number | undefined) ?? 0
}

export async function rsvp(id: string) {
  return (await db.doc(`rsvps/${id}`).get()).data()
}

export async function addWish(name: string, message: string, hidden = false) {
  await db
    .collection('wishes')
    .add({ name, message, hidden, createdAt: FieldValue.serverTimestamp() })
}
