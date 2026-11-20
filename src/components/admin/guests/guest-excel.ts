import { readSheet } from 'read-excel-file/browser'
import writeXlsxFile from 'write-excel-file/browser'
import type { AdminGuest } from '@/lib/firebase/admin-client'
import { guestLink, IMPORT_TEMPLATE_HEADERS } from '@/lib/guests'
import { SIDE_LABEL } from '@/lib/invitation/helpers'

// Nhập/xuất Excel ngay trong trình duyệt (không có server).

/** Đọc sheet đầu tiên của file .xlsx thành mảng dòng */
export async function readGuestFile(file: File): Promise<unknown[][]> {
  return (await readSheet(file)) as unknown[][]
}

const bold = (value: string) => ({ value, fontWeight: 'bold' as const })

/** File mẫu để điền danh sách khách */
export function downloadImportTemplate() {
  return writeXlsxFile(
    [
      IMPORT_TEMPLATE_HEADERS.map(bold),
      [{ value: 'Anh Nam' }, { value: 'Nhà trai' }, { value: 'Bạn đại học' }, { value: 2 }],
      [{ value: 'Cô Hoa và gia đình' }, { value: 'Nhà gái' }, { value: 'Họ hàng' }, { value: 4 }],
    ],
    { columns: [{ width: 28 }, { width: 12 }, { width: 18 }, { width: 10 }] },
  ).toFile('mau-danh-sach-khach.xlsx')
}

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})

/** Xuất danh sách khách kèm link riêng và trạng thái đã mở */
export function exportGuests(guests: AdminGuest[], origin: string) {
  return writeXlsxFile(
    [
      [
        'Tên gọi',
        'Bên',
        'Nhóm',
        'Số người',
        'Mã',
        'Link thiệp',
        'Đã gửi',
        'Số lần mở',
        'Mở lần đầu',
      ].map(bold),
      ...guests.map((g) => [
        { value: g.displayName },
        { value: SIDE_LABEL[g.side] },
        { value: g.group ?? '' },
        g.maxAttendees ? { value: g.maxAttendees } : { value: '' },
        { value: g.code },
        { value: guestLink(origin, g.code) },
        { value: g.sentAt ? dateTime.format(g.sentAt) : '' },
        { value: g.openCount ?? 0 },
        { value: g.firstOpenedAt ? dateTime.format(g.firstOpenedAt) : '' },
      ]),
    ],
    {
      columns: [
        { width: 28 },
        { width: 12 },
        { width: 18 },
        { width: 10 },
        { width: 10 },
        { width: 40 },
        { width: 18 },
        { width: 10 },
        { width: 18 },
      ],
    },
  ).toFile('danh-sach-khach.xlsx')
}
