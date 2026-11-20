/** Bên tổ chức: nhà gái (bride) hoặc nhà trai (groom) */
export type Side = 'bride' | 'groom'

/** Sự kiện có thể thuộc một bên hoặc chung cả hai */
export type EventSide = Side | 'both'

export type EventType = 'an_hoi' | 'vu_quy' | 'thanh_hon' | 'tiec_cuoi' | 'khac'

export const TEMPLATE_IDS = ['song-hy', 'nga', 'hoa-co'] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]

export interface Photo {
  src: string
  width: number
  height: number
  alt: string
  /** Có khi ảnh được tải lên Cloudinary */
  publicId?: string
}

export interface Person {
  fullName: string
  /** Tên gọi trên thiệp, ví dụ "Minh Tuấn" */
  shortName: string
  /** Thứ bậc trong gia đình, ví dụ "Trưởng nam", "Út nữ" */
  title?: string
  father?: string
  mother?: string
  /** Địa chỉ nhà bố mẹ, in dưới tên bố mẹ */
  address?: string
  photo?: Photo
}

export interface WeddingEvent {
  id: string
  side: EventSide
  type: EventType
  title: string
  /** ISO 8601 có múi giờ, ví dụ 2027-01-09T10:30:00+07:00 */
  startAt: string
  venue: string
  address: string
  mapUrl?: string
  /** Ngày âm lịch dạng chữ, ví dụ "Tức ngày 02 tháng Chạp năm Bính Ngọ" */
  lunarText?: string
}

export interface Guest {
  code: string
  side: Side
  /** Cách gọi trên thiệp, ví dụ "Anh Nam", "Cô Hoa và gia đình" */
  displayName: string
  /** Số người tối đa khi xác nhận dự tiệc */
  maxAttendees?: number
}

export interface Invitation {
  slug: string
  templateId: TemplateId
  groom: Person
  bride: Person
  /** Câu trích dẫn ngắn ở đầu thiệp */
  quote?: string
  cover: Photo
  events: WeddingEvent[]
  gallery: Photo[]
  musicUrl?: string
  /** Bật form xác nhận dự tiệc (mặc định bật) */
  rsvpEnabled?: boolean
  /** Hạn xác nhận dạng YYYY-MM-DD (giờ Việt Nam); quá hạn thì form đóng */
  rsvpDeadline?: string
  /** Bật sổ lưu bút (mặc định bật) */
  wishesEnabled?: boolean
  /** Tài khoản nhận mừng cưới của từng bên (QR VietQR) */
  gifts?: Partial<Record<Side, GiftAccount>>
}

export interface GiftAccount {
  /** Mã BIN ngân hàng (NAPAS), ví dụ 970436 = Vietcombank */
  bankBin: string
  accountNumber: string
  /** In hoa không dấu, như trên thẻ */
  accountName: string
}

/** Document site/wedding trong Firestore: nội dung thiệp (một đám cưới duy nhất) */
export type WeddingDoc = Omit<Invitation, 'slug' | 'cover'> & {
  /** Chưa có ảnh bìa → dùng ảnh bìa mặc định */
  cover?: Photo
  /** Tin nhắn mời mẫu để gửi kèm link (trang quản lý → Khách mời) */
  inviteMessage?: string
}

/** Document guests/{code}. Thời điểm mở lưu dạng Timestamp của Firestore. */
export interface GuestDoc {
  side: Side
  displayName: string
  group?: string
  maxAttendees?: number
  openCount?: number
  /** Lúc admin gửi link cho khách (chép tin nhắn, chia sẻ hoặc tự đánh dấu) */
  sentAt?: unknown
}

/** RSVP (rsvps/{id}): link riêng id = mã khách, link chung id ngẫu nhiên */
export interface RsvpInput {
  guestCode?: string
  name: string
  side: Side
  attending: boolean
  /** Số người sẽ đến (0 nếu không đến) */
  count: number
  note?: string
}

/** Lời chúc (wishes/{id}) */
export interface WishInput {
  name: string
  message: string
  side?: Side
  guestCode?: string
}
