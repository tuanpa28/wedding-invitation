import { publishSchema } from '@/lib/validators/wedding'
import { readJson, route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { setPublished } from '@/server/services/weddings'

/** POST { published: true | false } — gửi thiệp / chuyển về nháp */
export const POST = route<RouteContext<'/api/weddings/[id]/publish'>>(
  async (request, { params }) => {
    const user = await requireApiUser(request)
    const { id } = await params
    const { published } = await readJson(request, publishSchema)
    return Response.json({ wedding: await setPublished(user.id, id, published) })
  },
)
