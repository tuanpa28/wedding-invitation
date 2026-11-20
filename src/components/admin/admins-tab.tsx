'use client'

import { Loader2, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { currentAdminEmail, saveAdmins, subscribeAdmins } from '@/lib/firebase/admin-client'
import { errorMessage } from './editor-types'
import { Field } from './field'

/** Khớp giới hạn trong firestore.rules */
export const MAX_ADMINS = 10

const emailSchema = z.email('Email chưa đúng định dạng').transform((e) => e.trim().toLowerCase())

/** Người đồng quản lý: ai trong danh sách cũng đăng nhập và sửa được thiệp như nhau */
export function AdminsTab() {
  const me = currentAdminEmail()
  const [emails, setEmails] = useState<string[] | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(
    () =>
      subscribeAdmins(setEmails, (e) => {
        toast.error(errorMessage(e, 'Không tải được danh sách người quản lý'))
        setEmails([])
      }),
    [],
  )

  async function save(next: string[], done: string) {
    setPending(true)
    try {
      await saveAdmins(next)
      toast.success(done)
      return true
    } catch (e) {
      toast.error(errorMessage(e))
      return false
    } finally {
      setPending(false)
    }
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault()
    const parsed = emailSchema.safeParse(draft.trim())
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    const email = parsed.data
    if (emails?.includes(email)) return setError('Email này đã có trong danh sách')
    if ((emails?.length ?? 0) >= MAX_ADMINS) return setError(`Tối đa ${MAX_ADMINS} người quản lý`)
    setError(undefined)
    if (await save([...(emails ?? []), email], `Đã thêm ${email}`)) setDraft('')
  }

  async function confirmRemove() {
    if (!removing || !emails) return
    await save(
      emails.filter((e) => e !== removing),
      `Đã bỏ quyền của ${removing}`,
    )
    setRemoving(null)
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6 pb-10">
      <p className="text-sm text-muted-foreground">
        Người trong danh sách đăng nhập bằng đúng tài khoản Google có email này là vào được trang
        quản lý, với quyền như nhau: sửa thiệp, quản lý khách, xem phản hồi. Không cần gửi lời mời,
        chỉ cần báo họ mở <span className="font-mono text-foreground">/admin</span>.
      </p>

      {emails === null ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" aria-busy="true" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card" aria-label="Người quản lý">
          {emails.map((email) => {
            const isMe = email === me
            return (
              <li key={email} className="flex items-center gap-3 p-4">
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm">{email}</span>
                {isMe ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Bạn
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    title="Bỏ quyền quản lý"
                    aria-label={`Bỏ quyền quản lý của ${email}`}
                    onClick={() => setRemoving(email)}
                  >
                    <Trash2 />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={onAdd} noValidate className="flex items-start gap-2">
        <Field id="new-admin" label="Thêm người quản lý" error={error} className="flex-1">
          <Input
            id="new-admin"
            type="email"
            inputMode="email"
            autoComplete="off"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setError(undefined)
            }}
            placeholder="email@gmail.com"
            aria-invalid={Boolean(error)}
          />
        </Field>
        <Button type="submit" className="mt-[22px]" disabled={!draft.trim() || pending}>
          {pending ? <Loader2 className="animate-spin" /> : <UserPlus />} Thêm
        </Button>
      </form>
      <p className="-mt-3 text-xs text-muted-foreground">
        Bạn không tự bỏ quyền của mình được, để thiệp luôn còn ít nhất một người quản lý. Tối đa{' '}
        {MAX_ADMINS} người.
      </p>

      <AlertDialog open={removing !== null} onOpenChange={(next) => !next && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ quyền quản lý của {removing}?</AlertDialogTitle>
            <AlertDialogDescription>
              Người này sẽ không vào được trang quản lý nữa. Thêm lại lúc nào cũng được.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Giữ lại</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemove}>
              Bỏ quyền
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
