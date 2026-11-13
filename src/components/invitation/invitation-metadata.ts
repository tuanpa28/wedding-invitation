import type { Metadata } from 'next'
import { eventDateParts, featuredEvent } from '@/lib/invitation/helpers'
import { getGuest, getInvitation } from '@/server/services/invitations'

const NOT_FOUND: Metadata = {
  title: 'Không tìm thấy thiệp — Thiệp Hồng',
  robots: { index: false, follow: false },
}

/** Tiêu đề + ảnh preview khi chia sẻ link thiệp (Zalo, Messenger, Facebook) */
export async function invitationMetadata(slug: string, guestCode?: string): Promise<Metadata> {
  const [invitation, guest] = await Promise.all([
    getInvitation(slug),
    guestCode ? getGuest(slug, guestCode) : null,
  ])
  if (!invitation || (guestCode && !guest)) return NOT_FOUND

  const names = `${invitation.groom.shortName} & ${invitation.bride.shortName}`
  const featured = featuredEvent(invitation.events, guest?.side)
  const date = featured ? eventDateParts(featured.startAt).date : ''

  const title = guest ? `Kính mời ${guest.displayName} — Lễ cưới ${names}` : `Lễ cưới ${names}`
  const description = `Trân trọng kính mời tới dự lễ cưới của ${names}${date ? ` ngày ${date}` : ''}.`

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: 'website',
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
