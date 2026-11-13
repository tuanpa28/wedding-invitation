import { weddingInfoSchema } from '@/lib/validators/wedding'
import { readJson, route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { deleteWedding, getWeddingForEdit, updateWeddingInfo } from '@/server/services/weddings'

type Ctx = RouteContext<'/api/weddings/[id]'>

export const GET = route<Ctx>(async (request, { params }) => {
  const user = await requireApiUser(request)
  const { id } = await params
  return Response.json({ wedding: await getWeddingForEdit(user.id, id) })
})

/** PATCH — sửa thông tin chung (gửi field nào sửa field đó) */
export const PATCH = route<Ctx>(async (request, { params }) => {
  const user = await requireApiUser(request)
  const { id } = await params
  const patch = await readJson(request, weddingInfoSchema)
  return Response.json({ wedding: await updateWeddingInfo(user.id, id, patch) })
})

/** DELETE — xoá thiệp (chỉ người tạo) */
export const DELETE = route<Ctx>(async (request, { params }) => {
  const user = await requireApiUser(request)
  const { id } = await params
  await deleteWedding(user.id, id)
  return new Response(null, { status: 204 })
})
