// Đọc nội dung thiệp lúc build (next build) để nhúng sẵn vào HTML: thiệp hiện ngay khi mở link,
// không phải đợi tải JS + đọc Firestore. Không đọc được (chưa cấu hình, emulator chưa bật...) → null,
// trang tự đọc Firestore ở trình duyệt như bình thường.
import type { Invitation } from '@/lib/invitation/types'
import { fetchInvitation } from './public-data'

let cached: Promise<Invitation | null> | undefined

export function loadWeddingSnapshot(): Promise<Invitation | null> {
  // Khi chạy next dev thì đọc mới mỗi request; lúc build chỉ đọc một lần
  if (process.env.NODE_ENV === 'development') cached = undefined
  cached ??= Promise.race([
    fetchInvitation().catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 8_000)),
  ]).then((invitation) => {
    console.log(
      invitation
        ? `[thiep-hong] Đã nhúng nội dung thiệp vào HTML (${invitation.groom.shortName} & ${invitation.bride.shortName})`
        : '[thiep-hong] Không đọc được nội dung thiệp lúc build → thiệp sẽ đọc Firestore ở trình duyệt',
    )
    return invitation
  })
  return cached
}

/** Tiêu đề + mô tả + ảnh khi chia sẻ link (Zalo, Messenger, Facebook) */
export function shareMetadata(invitation: Invitation | null) {
  if (!invitation) return null
  const couple = `${invitation.groom.shortName} & ${invitation.bride.shortName}`
  const first = [...invitation.events].sort(
    (a, b) => Date.parse(a.startAt) - Date.parse(b.startAt),
  )[0]
  const date = first
    ? new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(new Date(first.startAt))
    : null
  const title = `Lễ cưới ${couple}`
  const description = date
    ? `Trân trọng kính mời bạn tới dự lễ cưới của ${couple} — ${date}.`
    : `Trân trọng kính mời bạn tới dự lễ cưới của ${couple}.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website' as const,
      locale: 'vi_VN',
      images: [
        {
          url: invitation.cover.src,
          width: invitation.cover.width,
          height: invitation.cover.height,
        },
      ],
    },
  }
}
