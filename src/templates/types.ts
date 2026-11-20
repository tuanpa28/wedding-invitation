import { coupleOrder, eventsForSide } from '@/lib/invitation/helpers'
import type { Guest, Invitation, Person, WeddingEvent } from '@/lib/invitation/types'

/** Dữ liệu đã xử lý sẵn cho template (lọc sự kiện theo bên khách, thứ tự tên, ...) */
export interface TemplateProps {
  invitation: Invitation
  guest?: Guest
  /** Sự kiện khách được thấy (tối đa một): lễ của bên khách, link chung là lễ chung hai bên */
  events: WeddingEvent[]
  /** Sự kiện in ngày lớn + đếm ngược. Không có (link chung chưa có lễ chung) → ẩn ngày, đếm ngược */
  featured?: WeddingEvent
  /** [người đứng trước, người đứng sau] theo bên của khách */
  couple: [Person, Person]
}

export function buildTemplateProps(invitation: Invitation, guest?: Guest): TemplateProps {
  const events = eventsForSide(invitation.events, guest?.side)
  return {
    invitation,
    guest,
    events,
    featured: events[0],
    couple: coupleOrder(invitation, guest?.side),
  }
}
