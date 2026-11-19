/** Bên tổ chức: nhà gái (bride) hoặc nhà trai (groom) */
export type Side = 'bride' | 'groom'

/** Sự kiện có thể thuộc một bên hoặc chung cả hai */
export type EventSide = Side | 'both'

export type EventType = 'an_hoi' | 'vu_quy' | 'thanh_hon' | 'tiec_cuoi' | 'khac'

export const TEMPLATE_IDS = ['song-hy', 'thanh-lich', 'hoa-co'] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]

export interface Photo {
  src: string
  width: number
  height: number
  alt: string
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

export interface StoryItem {
  date: string
  title: string
  text: string
  photo?: Photo
}

export interface Guest {
  code: string
  side: Side
  /** Cách gọi trên thiệp, ví dụ "Anh Nam", "Cô Hoa và gia đình" */
  displayName: string
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
  story: StoryItem[]
  gallery: Photo[]
  musicUrl?: string
}

/** Document site/wedding trong Firestore: nội dung thiệp (một đám cưới duy nhất) */
export type WeddingDoc = Omit<Invitation, 'slug' | 'cover'> & {
  /** Chưa có ảnh bìa → dùng ảnh bìa mặc định */
  cover?: Photo
}

/** Document guests/{code}. Thời điểm mở lưu dạng Timestamp của Firestore. */
export interface GuestDoc {
  side: Side
  displayName: string
  group?: string
  maxAttendees?: number
  openCount?: number
}
