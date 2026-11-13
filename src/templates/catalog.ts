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
  'thanh-lich': {
    id: 'thanh-lich',
    name: 'Thanh Lịch',
    description: 'Tối giản hiện đại: chữ lớn, tờ lịch tháng cưới khoanh ngày.',
    swatch: ['#f6f5f1', '#1c2430', '#7d8ca3'],
    glyph: '09',
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
