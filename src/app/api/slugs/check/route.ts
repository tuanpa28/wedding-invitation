import { slugSchema } from '@/lib/validators/wedding'
import { route } from '@/server/http'
import { requireApiUser } from '@/server/session'
import { isSlugAvailable } from '@/server/services/weddings'

/** GET ?slug=tuan-lan — đường dẫn còn trống không (dùng khi tạo/sửa thiệp) */
export const GET = route(async (request) => {
  await requireApiUser(request)
  const parsed = slugSchema.safeParse(new URL(request.url).searchParams.get('slug') ?? '')
  if (!parsed.success) {
    return Response.json({ available: false, message: parsed.error.issues[0]?.message })
  }
  return Response.json({ slug: parsed.data, available: await isSlugAvailable(parsed.data) })
})
