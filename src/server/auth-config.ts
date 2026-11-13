import 'server-only'

/** Đăng nhập Google chỉ bật khi đã có OAuth client (xem README → Đăng nhập Google). */
export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/**
 * Đăng nhập thử bằng email + mật khẩu, dùng để phát triển và chạy E2E khi chưa có Google.
 * Chỉ bật khi DEV_LOGIN=true **và** database là Postgres trên máy (localhost),
 * nên không thể vô tình bật trên production (Neon).
 */
export function isDevLoginEnabled() {
  if (process.env.DEV_LOGIN !== 'true') return false
  try {
    return LOCAL_HOSTS.has(new URL(process.env.DATABASE_URL ?? '').hostname)
  } catch {
    return false
  }
}
