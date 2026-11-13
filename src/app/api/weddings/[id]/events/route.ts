import { eventsSchema } from '@/lib/validators/wedding'
import { readJson, route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { replaceEvents } from '@/server/services/weddings'

/** PUT — thay toàn bộ danh sách sự kiện */
export const PUT = route<RouteContext<'/api/weddings/[id]/events'>>(async (request, { params }) => {
  const user = await requireApiUser(request)
  const { id } = await params
  const { events } = await readJson(request, eventsSchema)
  await replaceEvents(user.id, id, events)
  return Response.json({ ok: true })
})
