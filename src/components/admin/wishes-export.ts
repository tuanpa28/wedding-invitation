import writeXlsxFile from 'write-excel-file/browser'
import type { AdminWish } from '@/lib/firebase/admin-client'
import { SIDE_LABEL } from '@/lib/invitation/helpers'

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
