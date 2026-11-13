import { route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { createInvite } from '@/server/services/members'

/** POST — tạo link mời đồng quản lý */
export const POST = route<RouteContext<'/api/weddings/[id]/invites'>>(
  async (request, { params }) => {
    const user = await requireApiUser(request)
    const { id } = await params
    return Response.json({ invite: await createInvite(user.id, id) }, { status: 201 })
  },
)
