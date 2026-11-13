import { createWeddingSchema } from '@/lib/validators/wedding'
import { readJson, route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { createWedding, listMyWeddings } from '@/server/services/weddings'

/** GET /api/weddings — thiệp mình quản lý */
export const GET = route(async (request) => {
  const user = await requireApiUser(request)
  return Response.json({ weddings: await listMyWeddings(user.id) })
})

/** POST /api/weddings — tạo thiệp nháp */
export const POST = route(async (request) => {
  const user = await requireApiUser(request)
  const input = await readJson(request, createWeddingSchema)
  return Response.json({ wedding: await createWedding(user.id, input) }, { status: 201 })
})
