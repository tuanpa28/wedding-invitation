import {
  coupleOrder,
  eventsForSide,
  featuredEvent,
  type CalendarCouple,
} from '@/lib/invitation/helpers'
import type { Guest, Invitation, Person, WeddingEvent } from '@/lib/invitation/types'

/** Dữ liệu đã xử lý sẵn cho template (lọc sự kiện theo bên khách, thứ tự tên, ...) */
export interface TemplateProps {
  invitation: Invitation
  guest?: Guest
  /** Sự kiện khách được thấy, đã sắp xếp theo thời gian */
  events: WeddingEvent[]
  /** Sự kiện chính: in ngày lớn + đếm ngược */
  featured: WeddingEvent
  /** [người đứng trước, người đứng sau] theo bên của khách */
  couple: [Person, Person]
  calendarCouple: CalendarCouple
}

export function buildTemplateProps(invitation: Invitation, guest?: Guest): TemplateProps {
  const events = eventsForSide(invitation.events, guest?.side)
  const featured = featuredEvent(invitation.events, guest?.side) ?? events[0]
  return {
    invitation,
    guest,
    events,
    featured,
    couple: coupleOrder(invitation, guest?.side),
    calendarCouple: {
      slug: invitation.slug,
      groom: { shortName: invitation.groom.shortName },
      bride: { shortName: invitation.bride.shortName },
    },
  }
}
