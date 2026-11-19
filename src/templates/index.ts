import { lazy } from 'react'
import type { TemplateId } from '@/lib/invitation/types'
import type { TemplateProps } from './types'

/**
 * Component của từng template, tải lười: khách chỉ tải code + font của đúng mẫu đang dùng.
 * Thông tin mẫu (tên, mô tả, màu) nằm ở ./catalog để trang quản lý dùng mà không tải template.
 */
export const TEMPLATE_LOADERS: Record<
  TemplateId,
  () => Promise<{ default: React.ComponentType<TemplateProps> }>
> = {
  'song-hy': () => import('./song-hy'),
  'thanh-lich': () => import('./thanh-lich'),
  'hoa-co': () => import('./hoa-co'),
}

export const TEMPLATE_COMPONENTS = {
  'song-hy': lazy(TEMPLATE_LOADERS['song-hy']),
  'thanh-lich': lazy(TEMPLATE_LOADERS['thanh-lich']),
  'hoa-co': lazy(TEMPLATE_LOADERS['hoa-co']),
} satisfies Record<TemplateId, React.LazyExoticComponent<React.ComponentType<TemplateProps>>>
