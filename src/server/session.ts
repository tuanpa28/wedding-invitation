import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getAuth } from './auth'
import { HttpError } from './http'

export interface SessionUser {
  id: string
  name: string
  email: string
  image: string | null
  role: string
}

/** Người dùng đang đăng nhập (hoặc null). Không truyền headers → đọc từ request hiện tại. */
export async function getSessionUser(requestHeaders?: Headers): Promise<SessionUser | null> {
  const session = await getAuth().api.getSession({
    headers: requestHeaders ?? (await headers()),
  })
  if (!session) return null
  const { id, name, email, image, role } = session.user
  return { id, name, email, image: image ?? null, role: role ?? 'user' }
}

/** Dùng trong trang: chưa đăng nhập → chuyển tới /login rồi quay lại `next` */
export async function requirePageUser(next: string) {
  const user = await getSessionUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}

/** Dùng trong API: chưa đăng nhập → 401 */
export async function requireApiUser(request: Request) {
  const user = await getSessionUser(request.headers)
  if (!user) throw new HttpError(401, 'unauthorized', 'Bạn cần đăng nhập')
  return user
}
