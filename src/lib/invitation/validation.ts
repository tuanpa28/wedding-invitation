/** Slug thiệp: chữ thường không dấu, số, gạch ngang; 3–60 ký tự; không bắt đầu/kết thúc bằng gạch */
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,58})[a-z0-9]$/

/** Mã khách: chữ, số, gạch ngang, gạch dưới; 3–32 ký tự */
const GUEST_CODE_PATTERN = /^[A-Za-z0-9_-]{3,32}$/

/** Các đường dẫn hệ thống, cặp đôi không được chọn làm slug */
export const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'dashboard',
  'login',
  'logout',
  'static',
  'assets',
  'favicon.ico',
])

export function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug) && !slug.includes('--') && !RESERVED_SLUGS.has(slug)
}

export function isValidGuestCode(code: string) {
  return GUEST_CODE_PATTERN.test(code)
}
