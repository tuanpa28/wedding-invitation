import type { Metadata } from 'next'
import { getMockGuest, getMockInvitation } from '@/mocks/invitations'
import { eventDateParts, featuredEvent } from './helpers'

/** Tiêu đề + ảnh preview khi chia sẻ link thiệp (Zalo, Messenger, Facebook) */
export function invitationMetadata(slug: string, guestCode?: string): Metadata {
  const notFound: Metadata = {
    title: 'Không tìm thấy thiệp — Thiệp Hồng',
    robots: { index: false, follow: false },
  }
  const invitation = getMockInvitation(slug)
  if (!invitation) return notFound

  const guest = guestCode ? getMockGuest(slug, guestCode) : undefined
  if (guestCode && !guest) return notFound
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
