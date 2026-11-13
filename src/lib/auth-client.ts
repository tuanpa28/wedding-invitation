import { createAuthClient } from 'better-auth/react'

/** Client Better Auth cho trình duyệt (cùng origin → không cần baseURL) */
export const authClient = createAuthClient()

/** Chỉ cho quay về đường dẫn nội bộ sau khi đăng nhập (chặn open redirect) */
export function safeNext(next: string | null | undefined, fallback = '/dashboard') {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : fallback
}
