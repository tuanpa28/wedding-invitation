import { z } from 'zod'
import { slugify } from '@/lib/invitation/slug'

// Mừng cưới qua chuyển khoản: QR theo chuẩn VietQR (NAPAS), ảnh do img.vietqr.io tạo (miễn phí).

/** Ngân hàng phổ biến (mã BIN theo NAPAS) */
export const BANKS = [
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970422', name: 'MB Bank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970443', name: 'SHB' },
  { bin: '970440', name: 'SeABank' },
  { bin: '970426', name: 'MSB' },
  { bin: '970448', name: 'OCB' },
  { bin: '970449', name: 'LPBank' },
  { bin: '970431', name: 'Eximbank' },
  { bin: '970428', name: 'Nam A Bank' },
  { bin: '970409', name: 'Bac A Bank' },
  { bin: '970433', name: 'VietBank' },
  { bin: '970425', name: 'ABBANK' },
  { bin: '970412', name: 'PVcomBank' },
  { bin: '970452', name: 'Kienlongbank' },
  { bin: '970419', name: 'NCB' },
  { bin: '970454', name: 'Viet Capital Bank (BVBank, Timo)' },
  { bin: '546034', name: 'Cake by VPBank' },
  { bin: '546035', name: 'Ubank by VPBank' },
] as const

export function bankName(bin: string) {
  return BANKS.find((b) => b.bin === bin)?.name ?? bin
}

/** Tên chủ tài khoản theo kiểu ngân hàng: in hoa, không dấu ("NGUYEN MINH TUAN") */
export function toBankName(name: string) {
  return slugify(name).replace(/-/g, ' ').toUpperCase().trim()
}

export const bankAccountSchema = z.object({
  bankBin: z.string().regex(/^\d{6}$/, 'Chọn ngân hàng'),
  accountNumber: z
    .string()
    .trim()
    .regex(/^[0-9A-Za-z]{4,25}$/, 'Số tài khoản chỉ gồm chữ số (4–25 ký tự)'),
  accountName: z
    .string()
    .trim()
    .min(2, 'Nhập tên chủ tài khoản')
    .max(60, 'Tối đa 60 ký tự')
    .transform(toBankName),
})

export type BankAccount = z.infer<typeof bankAccountSchema>

/**
 * Nội dung chuyển khoản gợi ý (không dấu, ngắn gọn để mọi app ngân hàng nhận):
 * "ANH NAM MUNG CUOI TUAN LAN"
 */
export function transferNote(guestName: string | undefined, groom: string, bride: string) {
  const lastWord = (n: string) => toBankName(n).split(' ').at(-1) ?? ''
  const couple = `${lastWord(groom)} ${lastWord(bride)}`.trim()
  const who = guestName ? toBankName(guestName) : ''
  return `${who ? `${who} ` : ''}MUNG CUOI ${couple}`.slice(0, 50).trim()
}

/** Ảnh QR VietQR (kèm logo ngân hàng, số tài khoản, tên) */
export function vietQrImageUrl(account: BankAccount, note: string) {
  const params = new URLSearchParams({ accountName: account.accountName, addInfo: note })
  return `https://img.vietqr.io/image/${account.bankBin}-${encodeURIComponent(account.accountNumber)}-compact2.png?${params}`
}
