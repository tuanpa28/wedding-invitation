import type { TemplateId } from '@/lib/invitation/types'
import { TEMPLATE_CATALOG } from './catalog'
import HoaCoTemplate from './hoa-co'
import SongHyTemplate from './song-hy'
import ThanhLichTemplate from './thanh-lich'
import type { TemplateDefinition } from './types'

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  'song-hy': { ...TEMPLATE_CATALOG['song-hy'], Component: SongHyTemplate },
  'thanh-lich': { ...TEMPLATE_CATALOG['thanh-lich'], Component: ThanhLichTemplate },
  'hoa-co': { ...TEMPLATE_CATALOG['hoa-co'], Component: HoaCoTemplate },
}
