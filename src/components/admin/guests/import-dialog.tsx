'use client'

import { FileDown, Loader2, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { importGuests } from '@/lib/firebase/admin-client'
import { parseGuestRows, type GuestInput, type ImportRowError } from '@/lib/guests'
import { SIDE_LABEL } from '@/lib/invitation/helpers'
import { errorMessage } from '../editor-types'
import { downloadImportTemplate, readGuestFile } from './guest-excel'

type Preview = { fileName: string; guests: GuestInput[]; errors: ImportRowError[] }

/** Nhập danh sách khách từ file Excel: chọn file → xem trước → nhập */
export function ImportDialog({
  open,
  onOpenChange,
  existingCodes,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingCodes: ReadonlySet<string>
}) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [pending, setPending] = useState(false)

  function close(next: boolean) {
    if (!next) setPreview(null)
    onOpenChange(next)
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const rows = await readGuestFile(file)
      setPreview({ fileName: file.name, ...parseGuestRows(rows, existingCodes) })
    } catch {
      toast.error(
        'Không đọc được file. Hãy dùng file .xlsx (Excel / Google Sheets → Tải xuống .xlsx)',
      )
    }
  }

  async function confirm() {
    if (!preview?.guests.length) return
    setPending(true)
    try {
      await importGuests(preview.guests)
      toast.success(`Đã nhập ${preview.guests.length} khách`)
      close(false)
    } catch (error) {
      toast.error(errorMessage(error, 'Nhập khách thất bại, thử lại sau'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nhập khách từ Excel</DialogTitle>
          <DialogDescription>
            Cột bắt buộc: <strong>Tên gọi</strong>, <strong>Bên</strong> (Nhà trai / Nhà gái). Cột
            tuỳ chọn: Nhóm, Số người. Mỗi khách được tạo link riêng.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          onChange={onFile}
        />

        {!preview ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => input.current?.click()}>
              <Upload /> Chọn file .xlsx
            </Button>
            <Button type="button" variant="outline" onClick={() => void downloadImportTemplate()}>
              <FileDown /> Tải file mẫu
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="text-sm">
              <span className="font-medium">{preview.fileName}</span>:{' '}
              <span className="text-gold">{preview.guests.length} khách hợp lệ</span>
              {preview.errors.length > 0 && (
                <span className="text-destructive"> · {preview.errors.length} dòng lỗi</span>
              )}
            </p>
            {preview.errors.length > 0 && (
              <ul className="max-h-28 overflow-auto rounded-lg bg-destructive/5 p-3 text-xs text-destructive">
                {preview.errors.map((e) => (
                  <li key={e.row}>
                    Dòng {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
            {preview.guests.length > 0 && (
              <div className="max-h-64 overflow-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Tên gọi</th>
                      <th className="px-3 py-2 font-medium">Bên</th>
                      <th className="px-3 py-2 font-medium">Nhóm</th>
                      <th className="px-3 py-2 font-medium">Số người</th>
                      <th className="px-3 py-2 font-medium">Mã</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.guests.map((g) => (
                      <tr key={g.code}>
                        <td className="px-3 py-1.5">{g.displayName}</td>
                        <td className="px-3 py-1.5">{SIDE_LABEL[g.side]}</td>
                        <td className="px-3 py-1.5">{g.group}</td>
                        <td className="px-3 py-1.5">{g.maxAttendees}</td>
                        <td className="px-3 py-1.5 font-mono text-xs">{g.code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {preview && (
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPreview(null)}>
              Chọn file khác
            </Button>
            <Button type="button" onClick={confirm} disabled={pending || !preview.guests.length}>
              {pending && <Loader2 className="animate-spin" />}
              Nhập {preview.guests.length} khách
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
