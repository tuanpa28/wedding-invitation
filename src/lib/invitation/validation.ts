/** Mã khách: chữ, số, gạch ngang, gạch dưới; 3–32 ký tự (cũng là id document guests/{code}) */
const GUEST_CODE_PATTERN = /^[A-Za-z0-9_-]{3,32}$/

export function isValidGuestCode(code: string) {
  return GUEST_CODE_PATTERN.test(code)
}

/** Lấy mã khách từ đường dẫn /m/<mã> (bỏ dấu / cuối, giải mã %xx) */
export function guestCodeFromPath(pathname: string): string | null {
  const match = /^\/m\/([^/]+)\/?$/.exec(pathname)
  if (!match) return null
  try {
    const code = decodeURIComponent(match[1])
    return isValidGuestCode(code) ? code : null
  } catch {
    return null
  }
}
