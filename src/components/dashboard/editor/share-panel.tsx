'use client'

import { Copy, ExternalLink, Link2, Loader2, Send, Trash2, Undo2, UserMinus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { api, ApiError } from '@/lib/api-client'
import { useOrigin } from '@/lib/use-origin'
import type { MemberInfo, PendingInvite } from '@/server/services/members'
import type { WeddingEditData } from '@/server/services/weddings'
import { SectionTitle } from './field'

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

async function copy(text: string, done = 'Đã chép link') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(done)
  } catch {
    toast.error('Không chép được, hãy chọn và chép tay')
  }
}

export function SharePanel({
  wedding,
  currentUserId,
  onSaved,
}: {
  wedding: WeddingEditData
  currentUserId: string
  onSaved: (patch: Partial<WeddingEditData>) => void
}) {
  return (
    <div className="flex flex-col gap-10">
      <PublishSection wedding={wedding} onSaved={onSaved} />
      <MembersSection wedding={wedding} currentUserId={currentUserId} />
      {wedding.role === 'owner' && <DangerSection wedding={wedding} />}
    </div>
  )
}

function PublishSection({
  wedding,
  onSaved,
}: {
  wedding: WeddingEditData
  onSaved: (patch: Partial<WeddingEditData>) => void
}) {
  const origin = useOrigin()
  const [pending, setPending] = useState(false)
  const url = `${origin}/${wedding.slug}`
  const published = wedding.status === 'published'

  async function setPublished(next: boolean) {
    setPending(true)
    try {
      const res = await api<{ wedding: Pick<WeddingEditData, 'status' | 'publishedAt'> }>(
        `/api/weddings/${wedding.id}/publish`,
        { body: { published: next } },
      )
      onSaved(res.wedding)
      toast.success(next ? 'Thiệp đã được gửi — khách mở link được rồi' : 'Đã chuyển về bản nháp')
    } catch (error) {
      toast.error(errorMessage(error, 'Không đổi được trạng thái'))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="grid gap-4">
      <SectionTitle>Gửi thiệp</SectionTitle>
      {published ? (
        <div className="grid gap-4 rounded-xl border border-gold/30 bg-gold-soft/60 p-5">
          <p className="text-sm">
            Thiệp đang mở cho khách. Gửi link chung dưới đây, hoặc link riêng từng khách (Phase tiếp
            theo).
          </p>
          <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-card p-1 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-sm">{url}</span>
            <Button type="button" size="sm" variant="secondary" onClick={() => copy(url)}>
              <Copy /> Chép
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a href={`/${wedding.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink /> Mở thiệp
              </a>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPublished(false)}
              disabled={pending}
            >
              <Undo2 /> Chuyển về nháp
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Thiệp đang là <strong className="text-foreground">bản nháp</strong>: chỉ người quản lý
            xem trước được, khách mở link sẽ báo không tìm thấy.
          </p>
          <div>
            <Button type="button" onClick={() => setPublished(true)} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              Gửi thiệp
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function MembersSection({
  wedding,
  currentUserId,
}: {
  wedding: WeddingEditData
  currentUserId: string
}) {
  const router = useRouter()
  const origin = useOrigin()
  const [data, setData] = useState<{ members: MemberInfo[]; invites: PendingInvite[] } | null>(null)
  const [pending, setPending] = useState(false)
  const isOwner = wedding.role === 'owner'

  // Tăng số này để tải lại danh sách sau mỗi thao tác
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    api<{ members: MemberInfo[]; invites: PendingInvite[] }>(`/api/weddings/${wedding.id}/members`)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((error: unknown) => {
        if (active) toast.error(errorMessage(error, 'Không tải được danh sách người quản lý'))
      })
    return () => {
      active = false
    }
  }, [wedding.id, reloadKey])

  async function run(action: () => Promise<unknown>, done: string) {
    setPending(true)
    try {
      await action()
      toast.success(done)
      setReloadKey((k) => k + 1)
    } catch (error) {
      toast.error(errorMessage(error, 'Không thực hiện được'))
    } finally {
      setPending(false)
    }
  }

  async function leave() {
    setPending(true)
    try {
      await api(`/api/weddings/${wedding.id}/members/${currentUserId}`, { method: 'DELETE' })
      toast.success('Bạn đã rời thiệp')
      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error(errorMessage(error, 'Không rời thiệp được'))
      setPending(false)
    }
  }

  const inviteUrl = (token: string) => `${origin}/invite/${token}`

  return (
    <section className="grid gap-4">
      <SectionTitle>Người quản lý</SectionTitle>
      <p className="text-sm text-muted-foreground">
        Mời người còn lại (hoặc người nhà) cùng sửa thiệp. Họ đăng nhập bằng Google của mình.
      </p>

      {!data ? (
        <div className="h-16 animate-pulse rounded-xl bg-muted" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {data.members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 p-3">
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-medium text-accent-foreground"
              >
                {m.name.trim().at(0)?.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {m.name}
                  {m.userId === currentUserId && (
                    <span className="font-normal text-muted-foreground"> (bạn)</span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{m.email}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {m.role === 'owner' ? 'Người tạo' : 'Cùng quản lý'}
              </span>
              {isOwner && m.role === 'editor' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title={`Xoá ${m.name}`}
                  disabled={pending}
                  onClick={() =>
                    run(
                      () =>
                        api(`/api/weddings/${wedding.id}/members/${m.userId}`, {
                          method: 'DELETE',
                        }),
                      `Đã xoá ${m.name}`,
                    )
                  }
                >
                  <UserMinus />
                </Button>
              )}
            </li>
          ))}
          {data.invites.map((invite) => (
            <li key={invite.id} className="flex flex-wrap items-center gap-2 p-3">
              <Link2 className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate font-mono text-xs">
                {inviteUrl(invite.token)}
              </span>
              <span className="text-xs text-muted-foreground">
                hết hạn {new Date(invite.expiresAt).toLocaleDateString('vi-VN')}
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => copy(inviteUrl(invite.token), 'Đã chép link mời')}
              >
                <Copy /> Chép
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                title="Huỷ link mời"
                disabled={pending}
                onClick={() =>
                  run(
                    () =>
                      api(`/api/weddings/${wedding.id}/invites/${invite.id}`, { method: 'DELETE' }),
                    'Đã huỷ link mời',
                  )
                }
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {isOwner ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending || !data}
            onClick={() =>
              run(async () => {
                const { invite } = await api<{ invite: PendingInvite }>(
                  `/api/weddings/${wedding.id}/invites`,
                  { method: 'POST' },
                )
                await copy(inviteUrl(invite.token), 'Đã tạo và chép link mời')
              }, 'Link mời dùng được một lần, trong 7 ngày')
            }
          >
            <Link2 /> Tạo link mời
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={leave} disabled={pending}>
            <UserMinus /> Rời thiệp này
          </Button>
        )}
      </div>
    </section>
  )
}

function DangerSection({ wedding }: { wedding: WeddingEditData }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function remove() {
    setPending(true)
    try {
      await api(`/api/weddings/${wedding.id}`, { method: 'DELETE' })
      toast.success('Đã xoá thiệp')
      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error(errorMessage(error, 'Không xoá được thiệp'))
      setPending(false)
    }
  }

  return (
    <section className="grid gap-3">
      <SectionTitle>Xoá thiệp</SectionTitle>
      <p className="text-sm text-muted-foreground">
        Xoá vĩnh viễn thiệp, sự kiện, album và danh sách khách. Không khôi phục được.
      </p>
      <div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={pending}>
              <Trash2 /> Xoá thiệp
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xoá thiệp /{wedding.slug}?</AlertDialogTitle>
              <AlertDialogDescription>
                Mọi dữ liệu của thiệp sẽ bị xoá và link khách đang giữ không mở được nữa. Không hoàn
                tác được.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Giữ lại</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={remove}>
                Xoá vĩnh viễn
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  )
}
