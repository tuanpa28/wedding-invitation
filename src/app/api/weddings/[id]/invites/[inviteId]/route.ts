import { route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { revokeInvite } from '@/server/services/members'

/** DELETE — huỷ link mời chưa dùng */
export const DELETE = route<RouteContext<'/api/weddings/[id]/invites/[inviteId]'>>(
  async (request, { params }) => {
    const user = await requireApiUser(request)
    const { id, inviteId } = await params
    await revokeInvite(user.id, id, inviteId)
    return new Response(null, { status: 204 })
  },
)
