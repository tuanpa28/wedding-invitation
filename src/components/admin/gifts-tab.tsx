'use client'

import { Loader2, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { bankAccountSchema, BANKS, transferNote, vietQrImageUrl } from '@/lib/gifts'
import { SIDE_LABEL } from '@/lib/invitation/helpers'
import type { GiftAccount, Side } from '@/lib/invitation/types'
import { errorMessage, type EditorFormProps } from './editor-types'
import { Field, issuesToErrors, SectionTitle } from './field'

/** Tài khoản nhận mừng cưới của từng bên → mục "Mừng cưới" có QR trên thiệp */
export function GiftsTab({ wedding, onSave }: EditorFormProps) {
  const gifts = wedding.gifts ?? {}

  async function saveSide(side: Side, account: GiftAccount | null) {
    const next = { ...gifts }
    if (account) next[side] = account
    else delete next[side]
    await onSave({ gifts: Object.keys(next).length ? next : null })
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <p className="text-sm text-muted-foreground">
        Nhập tài khoản ngân hàng để khách quét QR mừng cưới (chuẩn VietQR, app ngân hàng nào cũng
        quét được). Để trống thì thiệp không có mục này. Khách nhà trai thấy tài khoản nhà trai
        trước.
      </p>
      {(['groom', 'bride'] as const).map((side) => (
        <AccountForm
          key={side}
          side={side}
          account={gifts[side]}
          groom={wedding.groom.shortName}
          bride={wedding.bride.shortName}
          onSave={(account) => saveSide(side, account)}
        />
      ))}
      <p className="text-xs text-muted-foreground">
        Mẹo: sau khi lưu, mở app ngân hàng quét thử mã trong khung xem trước để chắc chắn đúng tài
        khoản.
      </p>
    </div>
  )
}

function AccountForm({
  side,
  account,
  groom,
  bride,
  onSave,
}: {
  side: Side
  account?: GiftAccount
  groom: string
  bride: string
  onSave: (account: GiftAccount | null) => Promise<void>
}) {
  const [bankBin, setBankBin] = useState(account?.bankBin ?? '')
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber ?? '')
  const [accountName, setAccountName] = useState(account?.accountName ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const parsed = bankAccountSchema.safeParse({ bankBin, accountNumber, accountName })
  const dirty =
    bankBin !== (account?.bankBin ?? '') ||
    accountNumber !== (account?.accountNumber ?? '') ||
    accountName !== (account?.accountName ?? '')

  async function run(action: () => Promise<void>, done: string) {
    setPending(true)
    try {
      await action()
      toast.success(done)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setPending(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!parsed.success) {
      setErrors(issuesToErrors(parsed.error.issues))
      return
    }
    setErrors({})
    setAccountName(parsed.data.accountName)
    await run(() => onSave(parsed.data), `Đã lưu tài khoản ${SIDE_LABEL[side].toLowerCase()}`)
  }

  const id = (f: string) => `gift-${side}-${f}`

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 rounded-xl border bg-card p-5">
      <SectionTitle
        aside={
          account && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  await onSave(null)
                  setBankBin('')
                  setAccountNumber('')
                  setAccountName('')
                }, 'Đã bỏ tài khoản')
              }
            >
              <Trash2 /> Bỏ tài khoản
            </Button>
          )
        }
      >
        {side === 'groom' ? 'Nhà trai (chú rể)' : 'Nhà gái (cô dâu)'}
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="grid content-start gap-4">
          <Field id={id('bank')} label="Ngân hàng" error={errors.bankBin}>
            <Select value={bankBin} onValueChange={setBankBin}>
              <SelectTrigger
                id={id('bank')}
                className="w-full"
                aria-invalid={Boolean(errors.bankBin)}
              >
                <SelectValue placeholder="Chọn ngân hàng" />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map((b) => (
                  <SelectItem key={b.bin} value={b.bin}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id={id('number')} label="Số tài khoản" error={errors.accountNumber}>
            <Input
              id={id('number')}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\s/g, ''))}
              inputMode="numeric"
              className="font-mono"
              aria-invalid={Boolean(errors.accountNumber)}
            />
          </Field>
          <Field
            id={id('name')}
            label="Tên chủ tài khoản"
            hint="Tự đổi sang in hoa không dấu như trên thẻ"
            error={errors.accountName}
          >
            <Input
              id={id('name')}
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              onBlur={() => parsed.success && setAccountName(parsed.data.accountName)}
              aria-invalid={Boolean(errors.accountName)}
            />
          </Field>
        </div>
        <div className="grid justify-items-center gap-2">
          <div className="grid aspect-[0.86] w-40 place-items-center overflow-hidden rounded-lg border bg-white">
            {parsed.success ? (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh QR từ img.vietqr.io
              <img
                src={vietQrImageUrl(parsed.data, transferNote(undefined, groom, bride))}
                alt="Xem trước mã QR"
                className="size-full object-contain"
              />
            ) : (
              <span className="px-3 text-center text-xs text-muted-foreground">
                Nhập đủ thông tin để xem trước QR
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={!dirty || pending}>
          {pending && <Loader2 className="animate-spin" />}
          Lưu tài khoản
        </Button>
      </div>
    </form>
  )
}
