import writeXlsxFile from 'write-excel-file/browser'
import type { AdminGuest, AdminRsvp, AdminWish } from '@/lib/firebase/admin-client'
import { SIDE_LABEL } from '@/lib/invitation/helpers'
import type { WeddingDoc } from '@/lib/invitation/types'

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})

const bold = (value: string) => ({ value, fontWeight: 'bold' as const })

/** Sổ lưu bút ra Excel để giữ làm kỷ niệm (cũ nhất trước, như lật sổ) */
export function exportWishes(wishes: AdminWish[]) {
  const ordered = [...wishes].sort(
    (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
  )
  return writeXlsxFile(
    [
      ['Người gửi', 'Bên', 'Lời chúc', 'Thời gian', 'Đang ẩn'].map(bold),
      ...ordered.map((w) => [
        { value: w.name },
        { value: w.side ? SIDE_LABEL[w.side] : '' },
        { value: w.message, wrap: true },
        { value: w.createdAt ? dateTime.format(w.createdAt) : '' },
        { value: w.hidden ? 'Có' : '' },
      ]),
    ],
    { columns: [{ width: 24 }, { width: 10 }, { width: 60 }, { width: 18 }, { width: 9 }] },
  ).toFile('so-luu-but.xlsx')
}

/**
 * Tải toàn bộ dữ liệu (nội dung thiệp, khách, phản hồi, lời chúc) thành một file JSON.
 * Giữ ở nơi riêng tư: file có danh sách khách và số tài khoản nhận mừng cưới.
 */
export function downloadBackup(data: {
  wedding: WeddingDoc
  guests: AdminGuest[]
  rsvps: AdminRsvp[]
  wishes: AdminWish[]
}) {
  const now = new Date()
  const body = JSON.stringify(
    { app: 'thiep-hong', version: 1, exportedAt: now.toISOString(), ...data },
    null,
    2,
  )
  const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `thiep-hong-sao-luu-${now.toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
