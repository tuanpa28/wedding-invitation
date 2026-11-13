import { photosSchema } from '@/lib/validators/wedding'
import { readJson, route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { replacePhotos } from '@/server/services/weddings'

/** PUT — thay toàn bộ album (thứ tự trong mảng là thứ tự hiển thị) */
export const PUT = route<RouteContext<'/api/weddings/[id]/photos'>>(async (request, { params }) => {
  const user = await requireApiUser(request)
  const { id } = await params
  const { photos } = await readJson(request, photosSchema)
  await replacePhotos(user.id, id, photos)
  return Response.json({ ok: true })
})
