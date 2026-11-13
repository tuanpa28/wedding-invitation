import { route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { listMembers } from '@/server/services/members'

/** GET — thành viên + link mời còn hiệu lực */
export const GET = route<RouteContext<'/api/weddings/[id]/members'>>(
  async (request, { params }) => {
    const user = await requireApiUser(request)
    const { id } = await params
    return Response.json(await listMembers(user.id, id))
  },
)
