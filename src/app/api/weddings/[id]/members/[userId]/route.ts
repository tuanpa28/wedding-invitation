import { route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { removeMember } from '@/server/services/members'

/** DELETE — người tạo xoá thành viên, hoặc thành viên tự rời thiệp */
export const DELETE = route<RouteContext<'/api/weddings/[id]/members/[userId]'>>(
  async (request, { params }) => {
    const user = await requireApiUser(request)
    const { id, userId } = await params
    await removeMember(user.id, id, userId)
    return new Response(null, { status: 204 })
  },
)
