import { z } from 'zod'
import { LIMITS } from '@/lib/invitation/defaults'
import { TEMPLATE_IDS } from '@/lib/invitation/types'

// Kiểm tra dữ liệu form trang quản lý trước khi ghi vào Firestore (site/wedding).
// Lưu ý: đây là output đã chuẩn hoá (chuỗi rỗng → bỏ field) — Firestore không nhận `undefined`,
// nên trước khi ghi luôn đi qua `toFirestore()`.

/** Chuỗi tuỳ chọn: bỏ khoảng trắng, chuỗi rỗng → undefined */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Tối đa ${max} ký tự`)
    .optional()
    .transform((v) => v || undefined)

const requiredText = (max: number, message: string) =>
  z.string().trim().min(1, message).max(max, `Tối đa ${max} ký tự`)

const httpsUrl = z.url({ protocol: /^https$/, message: 'Cần link bắt đầu bằng https://' })

const optionalHttpsUrl = z
  .union([z.literal(''), httpsUrl])
  .optional()
  .transform((v) => v || undefined)

/** Ảnh: chỉ nhận ảnh trên Cloudinary hoặc ảnh mẫu có sẵn trong public/demo */
export const photoSchema = z.object({
  src: z
    .string()
    .regex(
      /^(https:\/\/res\.cloudinary\.com\/|\/demo\/)/,
      'Ảnh phải được tải lên qua trang quản lý',
    ),
  width: z.int().positive().max(20_000),
  height: z.int().positive().max(20_000),
  alt: z.string().trim().max(200).default(''),
  publicId: z.string().max(300).optional(),
})

export const personSchema = z.object({
  fullName: requiredText(80, 'Nhập họ tên'),
  shortName: requiredText(40, 'Nhập tên gọi'),
  title: optionalText(40),
  father: optionalText(80),
  mother: optionalText(80),
  address: optionalText(200),
  photo: photoSchema.optional(),
})

export const templateSchema = z.object({ templateId: z.enum(TEMPLATE_IDS) })

export const infoSchema = z.object({
  groom: personSchema,
  bride: personSchema,
  quote: optionalText(300),
})

export const EVENT_TYPE_LABEL = {
  an_hoi: 'Lễ Ăn Hỏi',
  vu_quy: 'Lễ Vu Quy',
  thanh_hon: 'Lễ Thành Hôn',
  tiec_cuoi: 'Tiệc Cưới',
  khac: 'Khác',
} as const

export const eventSchema = z.object({
  id: z.string().min(1).max(40),
  side: z.enum(['bride', 'groom', 'both']),
  type: z.enum(['an_hoi', 'vu_quy', 'thanh_hon', 'tiec_cuoi', 'khac']),
  title: requiredText(80, 'Nhập tên sự kiện'),
  startAt: z.iso.datetime({ offset: true, message: 'Chọn ngày giờ' }),
  venue: requiredText(120, 'Nhập nơi tổ chức'),
  address: requiredText(200, 'Nhập địa chỉ'),
  mapUrl: optionalHttpsUrl,
  lunarText: optionalText(120),
})

export const eventsSchema = z.object({
  events: z
    .array(eventSchema)
    .min(1, 'Cần ít nhất một sự kiện')
    .max(LIMITS.events, `Tối đa ${LIMITS.events} sự kiện`),
})

export const gallerySchema = z.object({
  gallery: z.array(photoSchema).max(LIMITS.photos, `Tối đa ${LIMITS.photos} ảnh`),
})

export const coverSchema = z.object({ cover: photoSchema.nullable() })

export const musicSchema = z.object({ musicUrl: httpsUrl.nullable() })

export type EventInput = z.infer<typeof eventSchema>
export type PhotoInput = z.infer<typeof photoSchema>

/** Bỏ mọi giá trị `undefined` (Firestore không nhận) — giữ nguyên `null` để xoá giá trị */
export function toFirestore<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
