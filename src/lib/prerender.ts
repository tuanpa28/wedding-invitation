import { DEFAULT_COVER } from './invitation/defaults'
import { isTemplateId } from './invitation/helpers'
import type { Photo, WeddingDoc } from './invitation/types'

/**
 * Dấu vết của bản thiệp dựng sẵn lúc deploy: những thứ khách thấy ngay khi mở link (mẫu, ảnh bìa)
 * và ảnh xem trước khi chia sẻ link lên Zalo/Messenger (tên hai người, ngày cưới, ảnh bìa).
 * Các phần khác cũ cũng không sao: trang tự đọc bản mới từ Firestore sau khoảng nửa giây.
 */
export interface PrerenderStamp {
  templateId: string
  coverSrc: string
  couple: string
  firstDate: string | null
}

type Source = Pick<WeddingDoc, 'templateId' | 'groom' | 'bride' | 'events'> & { cover?: Photo }

export function prerenderStamp(w: Source): PrerenderStamp {
  const first = [...w.events].sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))[0]
  return {
    templateId: isTemplateId(w.templateId) ? w.templateId : 'song-hy',
    coverSrc: (w.cover ?? DEFAULT_COVER).src,
    couple: `${w.groom.shortName} & ${w.bride.shortName}`,
    firstDate: first ? first.startAt.slice(0, 10) : null,
  }
}

/** Những phần của bản dựng sẵn đã khác nội dung hiện tại (rỗng = không cần deploy lại) */
export function staleParts(built: PrerenderStamp, current: Source): string[] {
  const now = prerenderStamp(current)
  const parts: string[] = []
  if (built.templateId !== now.templateId) parts.push('mẫu thiệp')
  if (built.coverSrc !== now.coverSrc) parts.push('ảnh bìa')
  if (built.couple !== now.couple) parts.push('tên cô dâu, chú rể')
  if (built.firstDate !== now.firstDate) parts.push('ngày cưới')
  return parts
}
