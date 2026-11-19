'use client'

import { Copy, Gift } from 'lucide-react'
import { useState } from 'react'
import { bankName, transferNote, vietQrImageUrl } from '@/lib/gifts'
import { SIDE_LABEL } from '@/lib/invitation/helpers'
import type { GiftAccount, Guest, Invitation, Side } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'

/** Có tài khoản mừng cưới nào để hiện không (template dùng để quyết định hiện mục) */
export function hasGiftAccounts(invitation: Invitation) {
  return Boolean(invitation.gifts?.groom || invitation.gifts?.bride)
}

/**
 * Mừng cưới: QR VietQR + số tài khoản của từng bên. Khách link riêng thấy bên mình trước.
 * Ảnh QR chỉ tải khi khách bấm "Hiện mã QR" để trang nhẹ (mỗi ảnh ~30 KB).
 */
export function GiftSection({ invitation, guest }: { invitation: Invitation; guest?: Guest }) {
  const gifts = invitation.gifts ?? {}
  const order: Side[] = guest?.side === 'bride' ? ['bride', 'groom'] : ['groom', 'bride']
  const sides = order.filter((s) => gifts[s])
  const note = transferNote(
    guest?.displayName,
    invitation.groom.shortName,
    invitation.bride.shortName,
  )

  return (
    <div className="grid gap-4">
      <p className="text-center text-sm text-(--fb-muted)">
        Cảm ơn tấm lòng của bạn. Quét mã bằng app ngân hàng bất kỳ, hoặc chép số tài khoản.
      </p>
      <div className={cn('grid gap-4', sides.length > 1 && 'sm:grid-cols-2')}>
        {sides.map((side) => (
          <GiftCard
            key={side}
            label={
              side === 'groom'
                ? `Mừng cưới chú rể (${SIDE_LABEL.groom.toLowerCase()})`
                : `Mừng cưới cô dâu (${SIDE_LABEL.bride.toLowerCase()})`
            }
            account={gifts[side]!}
            note={note}
          />
        ))}
      </div>
    </div>
  )
}

function GiftCard({ label, account, note }: { label: string; account: GiftAccount; note: string }) {
  const [showQr, setShowQr] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      // trình duyệt chặn clipboard: khách vẫn chọn chép tay được
    }
  }

  return (
    <div className="rounded-(--fb-radius) border border-(--fb-line) bg-(--fb-card) p-5 text-center">
      <p className="text-xs tracking-[0.2em] text-(--fb-muted) uppercase">{label}</p>
      <div className="mx-auto mt-4 grid aspect-[0.86] w-full max-w-60 place-items-center overflow-hidden rounded-(--fb-radius) bg-white">
        {showQr ? (
          // eslint-disable-next-line @next/next/no-img-element -- ảnh QR từ img.vietqr.io
          <img
            src={vietQrImageUrl(account, note)}
            alt={`Mã QR chuyển khoản ${bankName(account.bankBin)} ${account.accountNumber}`}
            className="size-full object-contain"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowQr(true)}
            className="flex size-full flex-col items-center justify-center gap-2 text-sm text-(--fb-ink)"
          >
            <Gift className="size-8 text-(--fb-accent)" aria-hidden />
            Hiện mã QR
          </button>
        )}
      </div>
      <p className="mt-4 text-sm text-(--fb-muted)">{bankName(account.bankBin)}</p>
      <button
        type="button"
        onClick={() => copy(account.accountNumber, 'number')}
        className="mt-1 inline-flex items-center gap-2 text-xl font-semibold tracking-wider text-(--fb-ink) tabular-nums"
        title="Chép số tài khoản"
      >
        {account.accountNumber}
        <Copy className="size-4 text-(--fb-muted)" aria-hidden />
      </button>
      <p className="text-sm text-(--fb-ink)">{account.accountName}</p>
      <p className="mt-3 h-5 text-xs text-(--fb-accent)" aria-live="polite">
        {copied === 'number' ? 'Đã chép số tài khoản' : copied === 'note' ? 'Đã chép nội dung' : ''}
      </p>
      <button
        type="button"
        onClick={() => copy(note, 'note')}
        className="text-xs text-(--fb-muted) underline underline-offset-4"
      >
        Nội dung gợi ý: {note}
      </button>
    </div>
  )
}
