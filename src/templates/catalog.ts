import type { TemplateId } from '@/lib/invitation/types'

/** Thông tin template không kèm component — dùng được ở client (bộ chọn mẫu) mà không tải code template */
export interface TemplateInfo {
  id: TemplateId
  name: string
  description: string
  /** [nền, chữ, điểm nhấn] để vẽ thẻ chọn mẫu */
  swatch: [string, string, string]
  /** Ký hiệu đặc trưng hiển thị trên thẻ chọn mẫu */
  glyph: string
}

export const TEMPLATE_CATALOG: Record<TemplateId, TemplateInfo> = {
  'song-hy': {
    id: 'song-hy',
    name: 'Song Hỷ',
    description: 'Truyền thống: son mài đỏ, chữ vàng, mở thiệp bằng hai cánh cổng.',
    swatch: ['#6b130e', '#ecdcae', '#d3b064'],
    glyph: '囍',
  },
  nga: {
    id: 'nga',
    name: 'Ngà',
    description:
      'Trang nhã: nền ngà, phong bì con dấu sáp vàng, ảnh trượt ra, dải phim và lịch trái tim.',
    swatch: ['#f6f2ec', '#1f1a17', '#8a6f55'],
    glyph: '♡',
  },
  'hoa-co': {
    id: 'hoa-co',
    name: 'Hoa Cỏ',
    description: 'Pastel đồng quê: phong bì con dấu sáp, hoa dại tự nở khi cuộn.',
    swatch: ['#f1f4ea', '#36412f', '#e8c3bb'],
    glyph: '✿',
  },
}

export const TEMPLATE_LIST = Object.values(TEMPLATE_CATALOG)
