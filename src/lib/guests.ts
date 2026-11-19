import { z } from 'zod'
import { slugify } from '@/lib/invitation/slug'
import type { Side } from '@/lib/invitation/types'
import { isValidGuestCode } from '@/lib/invitation/validation'

// Logic khách mời dùng ở trang quản lý (không phụ thuộc Firebase → test được).

/** Bảng chữ không gây nhầm khi đọc/gõ lại: bỏ 0/O, 1/l/I */
const CODE_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'
export const GUEST_CODE_LENGTH = 6

/** Mã link ngẫu nhiên (khó đoán, ~887 triệu khả năng), không trùng mã đã có */
export function generateGuestCode(existing: ReadonlySet<string>, random = cryptoRandom): string {
  for (;;) {
    let code = ''
    for (let i = 0; i < GUEST_CODE_LENGTH; i++) {
      code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]
    }
    if (!existing.has(code)) return code
  }
}

function cryptoRandom() {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0] / 2 ** 32
}

export const guestSchema = z.object({
  code: z.string().refine(isValidGuestCode, 'Mã chỉ gồm chữ, số, - và _ (3–32 ký tự)'),
  displayName: z.string().trim().min(1, 'Nhập cách gọi khách').max(80, 'Tối đa 80 ký tự'),
  side: z.enum(['groom', 'bride'], { message: 'Chọn nhà trai hoặc nhà gái' }),
  group: z
    .string()
    .trim()
    .max(40, 'Tối đa 40 ký tự')
    .optional()
    .transform((v) => v || undefined),
  maxAttendees: z
    .int('Số người phải là số nguyên')
    .min(1, 'Ít nhất 1 người')
    .max(20, 'Tối đa 20 người')
    .optional(),
})

export type GuestInput = z.infer<typeof guestSchema>

/* ------------------------------------------------------------------ */
/* Nhập từ Excel                                                       */
/* ------------------------------------------------------------------ */

type Column = 'displayName' | 'side' | 'group' | 'maxAttendees' | 'code'

/** Tên cột chấp nhận (đã bỏ dấu, viết thường) */
const HEADER_ALIASES: Record<Column, string[]> = {
  displayName: ['ten-goi', 'ten', 'ten-khach', 'cach-goi', 'khach', 'ho-ten', 'name'],
  side: ['ben', 'nha', 'ben-nha', 'side'],
  group: ['nhom', 'nhom-khach', 'group'],
  maxAttendees: ['so-nguoi', 'so-luong', 'so-khach', 'nguoi'],
  code: ['ma', 'ma-khach', 'code'],
}

export const IMPORT_TEMPLATE_HEADERS = ['Tên gọi', 'Bên', 'Nhóm', 'Số người'] as const

export function parseSide(value: unknown): Side | null {
  const v = slugify(String(value ?? ''))
  if (['nha-trai', 'trai', 'groom', 'chu-re', 'nt'].includes(v)) return 'groom'
  if (['nha-gai', 'gai', 'bride', 'co-dau', 'ng'].includes(v)) return 'bride'
  return null
}

export interface ImportRowError {
  /** Số dòng trong file Excel (dòng tiêu đề là 1) */
  row: number
  message: string
}

/**
 * Đọc các dòng của file Excel (dòng đầu là tiêu đề) thành danh sách khách.
 * Mã link: dùng cột "Mã" nếu có và hợp lệ, không thì tự sinh.
 */
export function parseGuestRows(
  rows: unknown[][],
  existingCodes: ReadonlySet<string>,
  random = cryptoRandom,
): { guests: GuestInput[]; errors: ImportRowError[] } {
  const [header = [], ...body] = rows
  const index: Partial<Record<Column, number>> = {}
  header.forEach((cell, i) => {
    const key = slugify(String(cell ?? ''))
    for (const [column, aliases] of Object.entries(HEADER_ALIASES) as [Column, string[]][]) {
      if (index[column] === undefined && aliases.includes(key)) index[column] = i
    }
  })

  if (index.displayName === undefined || index.side === undefined) {
    return {
      guests: [],
      errors: [{ row: 1, message: 'Thiếu cột "Tên gọi" hoặc "Bên" ở dòng tiêu đề (xem file mẫu)' }],
    }
  }

  const used = new Set(existingCodes)
  const guests: GuestInput[] = []
  const errors: ImportRowError[] = []

  body.forEach((cells, i) => {
    const row = i + 2
    const cell = (column: Column) =>
      index[column] === undefined ? undefined : cells[index[column]!]
    const name = String(cell('displayName') ?? '').trim()
    if (!name && cells.every((c) => c === null || c === undefined || String(c).trim() === '')) {
      return // bỏ dòng trống
    }

    const side = parseSide(cell('side'))
    if (!side) {
      errors.push({ row, message: `Cột "Bên" phải là "Nhà trai" hoặc "Nhà gái"` })
      return
    }

    const rawCount = cell('maxAttendees')
    const count =
      rawCount === undefined || rawCount === null || String(rawCount).trim() === ''
        ? undefined
        : Number(rawCount)

    let code = String(cell('code') ?? '').trim()
    if (!code || !isValidGuestCode(code) || used.has(code)) code = generateGuestCode(used, random)

    const parsed = guestSchema.safeParse({
      code,
      displayName: name,
      side,
      group:
        cell('group') === undefined || cell('group') === null ? undefined : String(cell('group')),
      maxAttendees: count,
    })
    if (!parsed.success) {
      errors.push({ row, message: parsed.error.issues[0].message })
      return
    }
    used.add(parsed.data.code)
    guests.push(parsed.data)
  })

  return { guests, errors }
}

/* ------------------------------------------------------------------ */
/* Link + tin nhắn mời                                                 */
/* ------------------------------------------------------------------ */

export function guestLink(origin: string, code: string) {
  return `${origin.replace(/\/$/, '')}/m/${encodeURIComponent(code)}`
}

export const DEFAULT_INVITE_MESSAGE =
  'Thân mời {ten} tới dự lễ cưới của {chu_re} & {co_dau}.\nThiệp mời của {ten}: {link}\nRất mong được đón tiếp!'

export const INVITE_PLACEHOLDERS = [
  { key: '{ten}', label: 'cách gọi khách' },
  { key: '{link}', label: 'link thiệp riêng' },
  { key: '{chu_re}', label: 'tên chú rể' },
  { key: '{co_dau}', label: 'tên cô dâu' },
] as const

export function inviteMessage(
  template: string,
  values: { name: string; link: string; groom: string; bride: string },
) {
  return template
    .replaceAll('{ten}', values.name)
    .replaceAll('{link}', values.link)
    .replaceAll('{chu_re}', values.groom)
    .replaceAll('{co_dau}', values.bride)
}
