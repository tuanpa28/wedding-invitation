import { uploadSignSchema } from '@/lib/validators/wedding'
import { readJson, route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { signUpload } from '@/server/services/uploads'

/** POST { weddingId, kind } — ký upload thẳng lên Cloudinary */
export const POST = route(async (request) => {
  const user = await requireApiUser(request)
  const { weddingId, kind } = await readJson(request, uploadSignSchema)
  return Response.json(await signUpload(user.id, weddingId, kind))
})
