import { z } from 'zod'
import { LIMITS } from '@/lib/invitation/defaults'
import { TEMPLATE_IDS } from '@/lib/invitation/types'
import { isValidSlug } from '@/lib/invitation/validation'

// Schema dùng chung cho form (client) và API (server).

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

export const slugSchema = z.string().trim().toLowerCase().refine(isValidSlug, {
  message: 'Chỉ dùng chữ thường không dấu, số và dấu gạch ngang (3–60 ký tự)',
})

/** Ảnh: chỉ nhận ảnh trên Cloudinary hoặc ảnh mẫu có sẵn của app (next/image chỉ cho phép các nguồn này) */
export const photoSchema = z.object({
  src: z
    .string()
    .regex(/^(https:\/\/res\.cloudinary\.com\/|\/demo\/)/, 'Ảnh phải được tải lên qua Thiệp Hồng'),
  width: z.int().positive().max(20_000),
  height: z.int().positive().max(20_000),
  alt: z.string().trim().max(200).default(''),
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

export const createWeddingSchema = z.object({
  groomName: requiredText(40, 'Nhập tên chú rể'),
  brideName: requiredText(40, 'Nhập tên cô dâu'),
  slug: slugSchema,
  templateId: z.enum(TEMPLATE_IDS),
})

/** Sửa thông tin chung: gửi field nào sửa field đó */
export const weddingInfoSchema = z
  .object({
    slug: slugSchema,
    templateId: z.enum(TEMPLATE_IDS),
    groom: personSchema,
    bride: personSchema,
    // Chuỗi rỗng → null để xoá được câu trích dẫn
    quote: z
      .string()
      .trim()
      .max(300, 'Tối đa 300 ký tự')
      .nullable()
      .transform((v) => v || null),
    cover: photoSchema.nullable(),
    musicUrl: httpsUrl.nullable(),
  })
  .partial()

export const EVENT_TYPE_LABEL = {
  an_hoi: 'Lễ Ăn Hỏi',
  vu_quy: 'Lễ Vu Quy',
  thanh_hon: 'Lễ Thành Hôn',
  tiec_cuoi: 'Tiệc Cưới',
  khac: 'Khác',
} as const

export const eventSchema = z.object({
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
  events: z.array(eventSchema).max(LIMITS.events, `Tối đa ${LIMITS.events} sự kiện`),
})

export const storyItemSchema = z.object({
  date: requiredText(40, 'Nhập mốc thời gian'),
  title: requiredText(80, 'Nhập tiêu đề'),
  text: requiredText(600, 'Nhập nội dung'),
  photo: photoSchema.optional(),
})

export const storySchema = z.object({
  story: z.array(storyItemSchema).max(LIMITS.storyItems, `Tối đa ${LIMITS.storyItems} mục`),
})

export const galleryPhotoSchema = photoSchema.extend({ publicId: z.string().max(200).optional() })

export const photosSchema = z.object({
  photos: z.array(galleryPhotoSchema).max(LIMITS.photos, `Tối đa ${LIMITS.photos} ảnh`),
})

export const publishSchema = z.object({ published: z.boolean() })

export const uploadSignSchema = z.object({
  weddingId: z.uuid(),
  kind: z.enum(['image', 'audio']),
})

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>
export type WeddingInfoInput = z.infer<typeof weddingInfoSchema>
export type EventInput = z.infer<typeof eventSchema>
export type StoryItemInput = z.infer<typeof storyItemSchema>
export type GalleryPhotoInput = z.infer<typeof galleryPhotoSchema>
