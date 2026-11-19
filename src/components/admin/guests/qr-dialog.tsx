'use client'

import { Download } from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { slugify } from '@/lib/invitation/slug'

/** Mã QR của link thiệp riêng — in kèm thiệp giấy hoặc gửi ảnh cho khách */
export function QrDialog({
  target,
  onOpenChange,
}: {
  target: { name: string; link: string } | null
  onOpenChange: (open: boolean) => void
}) {
  const [dataUrl, setDataUrl] = useState<{ link: string; url: string } | null>(null)

  useEffect(() => {
    if (!target) return
    let active = true
    QRCode.toDataURL(target.link, { width: 640, margin: 2, color: { dark: '#26161d' } })
      .then((url) => active && setDataUrl({ link: target.link, url }))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [target])

  const ready = dataUrl && target && dataUrl.link === target.link

  return (
    <Dialog open={target !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Mã QR · {target?.name}</DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">
            {target?.link}
          </DialogDescription>
        </DialogHeader>
        <div className="mx-auto grid aspect-square w-full max-w-64 place-items-center rounded-lg border bg-white">
          {ready ? (
            // eslint-disable-next-line @next/next/no-img-element -- ảnh QR tạo tại chỗ (data URL)
            <img src={dataUrl.url} alt={`Mã QR thiệp của ${target.name}`} className="size-full" />
          ) : (
            <span className="text-sm text-muted-foreground">Đang tạo mã…</span>
          )}
        </div>
        {ready && (
          <Button asChild>
            <a href={dataUrl.url} download={`qr-${slugify(target.name) || 'khach'}.png`}>
              <Download /> Tải ảnh QR
            </a>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
