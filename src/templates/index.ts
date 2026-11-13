import type { TemplateId } from '@/lib/invitation/types'
import HoaCoTemplate from './hoa-co'
import SongHyTemplate from './song-hy'
import ThanhLichTemplate from './thanh-lich'
import type { TemplateDefinition } from './types'

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  'song-hy': {
    id: 'song-hy',
    name: 'Song Hỷ',
    description: 'Truyền thống: son mài đỏ, chữ vàng, mở thiệp bằng hai cánh cổng.',
    Component: SongHyTemplate,
  },
  'thanh-lich': {
    id: 'thanh-lich',
    name: 'Thanh Lịch',
    description: 'Tối giản hiện đại: chữ lớn, tờ lịch tháng cưới khoanh ngày.',
    Component: ThanhLichTemplate,
  },
  'hoa-co': {
    id: 'hoa-co',
    name: 'Hoa Cỏ',
    description: 'Pastel đồng quê: phong bì con dấu sáp, hoa dại tự nở khi cuộn.',
    Component: HoaCoTemplate,
  },
}
