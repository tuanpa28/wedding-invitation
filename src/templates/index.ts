import { lazy } from 'react'
import type { TemplateId } from '@/lib/invitation/types'
import type { TemplateProps } from './types'

/**
 * Component của từng template, tải lười: khách chỉ tải code + font của đúng mẫu đang dùng.
 * Thông tin mẫu (tên, mô tả, màu) nằm ở ./catalog để trang quản lý dùng mà không tải template.
 */
export const TEMPLATE_COMPONENTS: Record<
  TemplateId,
  React.LazyExoticComponent<React.ComponentType<TemplateProps>>
> = {
  'song-hy': lazy(() => import('./song-hy')),
  'thanh-lich': lazy(() => import('./thanh-lich')),
  'hoa-co': lazy(() => import('./hoa-co')),
}
