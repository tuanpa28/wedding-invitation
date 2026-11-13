import { getAuth } from '@/server/auth'

// Better Auth xử lý /api/auth/* (đăng nhập Google, đăng xuất, lấy session, ...)
const handler = (request: Request) => getAuth().handler(request)

export { handler as GET, handler as POST }
