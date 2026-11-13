import { storySchema } from '@/lib/validators/wedding'
import { readJson, route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { replaceStory } from '@/server/services/weddings'

/** PUT — thay toàn bộ chuyện tình */
export const PUT = route<RouteContext<'/api/weddings/[id]/story'>>(async (request, { params }) => {
  const user = await requireApiUser(request)
  const { id } = await params
  const { story } = await readJson(request, storySchema)
  await replaceStory(user.id, id, story)
  return Response.json({ ok: true })
})
