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
  nga: () => import('./nga'),
  'hoa-co': () => import('./hoa-co'),
}

export const TEMPLATE_COMPONENTS = {
  'song-hy': lazy(TEMPLATE_LOADERS['song-hy']),
  nga: lazy(TEMPLATE_LOADERS['nga']),
  'hoa-co': lazy(TEMPLATE_LOADERS['hoa-co']),
} satisfies Record<TemplateId, React.LazyExoticComponent<React.ComponentType<TemplateProps>>>
