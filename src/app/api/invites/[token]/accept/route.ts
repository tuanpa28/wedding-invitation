import { route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { acceptInvite } from '@/server/services/members'

/** POST — nhận lời mời đồng quản lý */
export const POST = route<RouteContext<'/api/invites/[token]/accept'>>(
  async (request, { params }) => {
    const user = await requireApiUser(request)
    const { token } = await params
    return Response.json(await acceptInvite(user.id, token))
  },
)
