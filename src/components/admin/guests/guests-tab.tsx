'use client'

import {
  FileDown,
  FileUp,
  ExternalLink,
  Link2,
  MoreHorizontal,
  MessageSquareText,
  Pencil,
  Plus,
  QrCode,
  Search,
  Send,
  Share2,
  Trash2,
  Users,
} from 'lucide-react'
import { useMemo, useState, useSyncExternalStore } from 'react'
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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  deleteGuest,
  setGuestsSent,
  type AdminGuest,
  type AdminRsvp,
} from '@/lib/firebase/admin-client'
import { DEFAULT_INVITE_MESSAGE, generateGuestCode, guestLink, inviteMessage } from '@/lib/guests'
import { SIDE_LABEL } from '@/lib/invitation/helpers'
import { slugify } from '@/lib/invitation/slug'
import { useSiteOrigin } from '@/lib/use-origin'
import { cn } from '@/lib/utils'
import { useAdminData } from '../admin-data'
import { canShare, copyText, shareText } from '../copy'
import { errorMessage, type EditorFormProps } from '../editor-types'
import { GuestDialog } from './guest-dialog'
import { exportGuests } from './guest-excel'
import { ImportDialog } from './import-dialog'
import { MessageDialog } from './message-dialog'
import { QrDialog } from './qr-dialog'

type SideFilter = 'all' | 'groom' | 'bride'
/** Tiến độ gửi: chưa gửi → đã gửi (chưa mở) → đã mở thiệp */
type SendFilter = 'all' | 'unsent' | 'sent' | 'opened'
type RsvpFilter = 'all' | 'attending' | 'declined' | 'pending'
type SortKey = 'name' | 'recent' | 'group' | 'unsentFirst'

const SORTS: Record<SortKey, (a: AdminGuest, b: AdminGuest) => number> = {
  name: (a, b) => a.displayName.localeCompare(b.displayName, 'vi'),
  recent: (a, b) => (b.lastOpenedAt?.getTime() ?? 0) - (a.lastOpenedAt?.getTime() ?? 0),
  unsentFirst: (a, b) =>
    Number(Boolean(a.sentAt || a.firstOpenedAt)) - Number(Boolean(b.sentAt || b.firstOpenedAt)) ||
    a.displayName.localeCompare(b.displayName, 'vi'),
  group: (a, b) =>
    (a.group ?? '\uffff').localeCompare(b.group ?? '\uffff', 'vi') ||
    a.displayName.localeCompare(b.displayName, 'vi'),
}

const sendState = (g: AdminGuest): Exclude<SendFilter, 'all'> =>
  g.firstOpenedAt ? 'opened' : g.sentAt ? 'sent' : 'unsent'

const noopSubscribe = () => () => {}

const openedParts = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Ho_Chi_Minh',
})

/** "19/11 18:37" theo giờ Việt Nam */
const openedFormat = {
  format(date: Date) {
    const part = (type: string) =>
      openedParts.formatToParts(date).find((p) => p.type === type)?.value
    return `${part('day')}/${part('month')} ${part('hour')}:${part('minute')}`
  },
}

/** Quản lý khách mời: danh sách realtime, link riêng, QR, tin nhắn mời, nhập/xuất Excel */
export function GuestsTab({ wedding, onSave }: EditorFormProps) {
  const origin = useSiteOrigin()
  const { guests, rsvps } = useAdminData()
  const [query, setQuery] = useState('')
  const [side, setSide] = useState<SideFilter>('all')
  const [send, setSend] = useState<SendFilter>('all')
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>('all')
  const [group, setGroup] = useState('all')
  const [sort, setSort] = useState<SortKey>('name')

  const [editing, setEditing] = useState<AdminGuest | 'new' | null>(null)
  const [newCode, setNewCode] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [qrTarget, setQrTarget] = useState<{ name: string; link: string } | null>(null)
  const [deleting, setDeleting] = useState<AdminGuest | null>(null)

  const codes = useMemo(() => new Set(guests?.map((g) => g.code)), [guests])
  const groups = useMemo(
    () =>
      [...new Set(guests?.flatMap((g) => (g.group ? [g.group] : [])))].sort((a, b) =>
        a.localeCompare(b, 'vi'),
      ),
    [guests],
  )

  // Phản hồi của khách có link riêng (id RSVP = mã khách)
  const rsvpByCode = useMemo(
    () => new Map((rsvps ?? []).flatMap((r) => (r.guestCode ? [[r.guestCode, r] as const] : []))),
    [rsvps],
  )

  const visible = useMemo(() => {
    const q = slugify(query)
    const rsvpOf = (g: AdminGuest): RsvpFilter => {
      const r = rsvpByCode.get(g.code)
      return !r ? 'pending' : r.attending ? 'attending' : 'declined'
    }
    return (guests ?? [])
      .filter(
        (g) =>
          (side === 'all' || g.side === side) &&
          (send === 'all' || sendState(g) === send) &&
          (rsvpFilter === 'all' || rsvpOf(g) === rsvpFilter) &&
          (group === 'all' || g.group === group) &&
          (!q || slugify(`${g.displayName} ${g.group ?? ''} ${g.code}`).includes(q)),
      )
      .sort(SORTS[sort])
  }, [guests, rsvpByCode, query, side, send, rsvpFilter, group, sort])

  const filtered =
    query !== '' || side !== 'all' || send !== 'all' || rsvpFilter !== 'all' || group !== 'all'
  function clearFilters() {
    setQuery('')
    setSide('all')
    setSend('all')
    setRsvpFilter('all')
    setGroup('all')
  }

  const stats = useMemo(() => {
    const list = guests ?? []
    return {
      total: list.length,
      people: list.reduce((sum, g) => sum + (g.maxAttendees ?? 1), 0),
      unsent: list.filter((g) => sendState(g) === 'unsent').length,
      sent: list.filter((g) => sendState(g) !== 'unsent').length,
      opened: list.filter((g) => g.firstOpenedAt).length,
    }
  }, [guests])

  const shareable = useSyncExternalStore(noopSubscribe, canShare, () => false)

  // Gửi link xong (chép tin nhắn / chép link / chia sẻ) thì tự đánh dấu đã gửi
  function markSent(g: AdminGuest) {
    if (g.sentAt || g.firstOpenedAt) return
    setGuestsSent([g.code], true).catch((e) => toast.error(errorMessage(e)))
  }

  async function toggleSent(g: AdminGuest) {
    try {
      await setGuestsSent([g.code], !g.sentAt)
      toast.success(
        g.sentAt ? `Đã bỏ đánh dấu ${g.displayName}` : `Đã đánh dấu gửi ${g.displayName}`,
      )
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const unsentVisible = visible.filter((g) => sendState(g) === 'unsent')
  async function markVisibleSent() {
    try {
      await setGuestsSent(
        unsentVisible.map((g) => g.code),
        true,
      )
      toast.success(`Đã đánh dấu ${unsentVisible.length} khách là đã gửi`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const template = wedding.inviteMessage ?? DEFAULT_INVITE_MESSAGE
  const messageFor = (g: { displayName: string; code: string }) =>
    inviteMessage(template, {
      name: g.displayName,
      link: guestLink(origin, g.code),
      groom: wedding.groom.shortName,
      bride: wedding.bride.shortName,
    })

  function openNew() {
    setNewCode(generateGuestCode(codes))
    setEditing('new')
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteGuest(deleting.code)
      toast.success(`Đã xoá ${deleting.displayName}`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Tiến độ gửi thiệp */}
      {stats.total > 0 && (
        <div className="grid gap-2 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
            <p>
              <span className="font-medium">{stats.total} khách</span>
              <span className="text-muted-foreground"> · khoảng {stats.people} người</span>
            </p>
            <p className="text-muted-foreground">
              Đã gửi <span className="font-medium text-foreground">{stats.sent}</span> · đã mở{' '}
              <span className="font-medium text-foreground">{stats.opened}</span> · chưa gửi{' '}
              <span className="font-medium text-primary">{stats.unsent}</span>
            </p>
          </div>
          <div
            className="flex h-1.5 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={`Đã mở ${stats.opened}, đã gửi chưa mở ${stats.sent - stats.opened}, chưa gửi ${stats.unsent}`}
          >
            <div className="bg-gold" style={{ width: `${(stats.opened / stats.total) * 100}%` }} />
            <div
              className="bg-primary/60"
              style={{ width: `${((stats.sent - stats.opened) / stats.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Thao tác */}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={openNew}>
          <Plus /> Thêm khách
        </Button>
        <Button type="button" variant="outline" onClick={() => setImportOpen(true)}>
          <FileUp /> Nhập Excel
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!guests?.length}
          onClick={() => void exportGuests(visible, origin)}
        >
          <FileDown /> Xuất Excel
        </Button>
        <Button type="button" variant="ghost" onClick={() => setMessageOpen(true)}>
          <MessageSquareText /> Tin nhắn mẫu
        </Button>
      </div>

      {/* Lọc */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <label className="relative col-span-2 sm:col-span-5">
          <span className="sr-only">Tìm khách</span>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, nhóm, mã…"
            className="pl-8"
          />
        </label>
        <FilterSelect
          label="Bên"
          value={side}
          onChange={(v) => setSide(v as SideFilter)}
          options={[
            ['all', 'Cả hai bên'],
            ['groom', 'Nhà trai'],
            ['bride', 'Nhà gái'],
          ]}
        />
        <FilterSelect
          label="Gửi thiệp"
          value={send}
          onChange={(v) => setSend(v as SendFilter)}
          options={[
            ['all', 'Mọi trạng thái gửi'],
            ['unsent', 'Chưa gửi'],
            ['sent', 'Đã gửi, chưa mở'],
            ['opened', 'Đã mở thiệp'],
          ]}
        />
        <FilterSelect
          label="Phản hồi"
          value={rsvpFilter}
          onChange={(v) => setRsvpFilter(v as RsvpFilter)}
          options={[
            ['all', 'Mọi phản hồi'],
            ['attending', 'Sẽ đến'],
            ['declined', 'Không đến'],
            ['pending', 'Chưa trả lời'],
          ]}
        />
        <FilterSelect
          label="Nhóm"
          value={group}
          onChange={setGroup}
          options={[['all', 'Mọi nhóm'], ...groups.map((g) => [g, g] as [string, string])]}
        />
        <FilterSelect
          label="Sắp xếp"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={[
            ['name', 'Theo tên'],
            ['recent', 'Mở thiệp gần đây'],
            ['group', 'Theo nhóm'],
            ['unsentFirst', 'Chưa gửi lên đầu'],
          ]}
        />
      </div>

      {/* Danh sách */}
      {guests === null ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy="true" />
      ) : guests.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <Users className="size-8 text-muted-foreground" />
          <p className="font-medium">Chưa có khách nào</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thêm từng khách, hoặc nhập cả danh sách từ Excel. Mỗi khách có một link thiệp riêng mang
            tên mình.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <p aria-live="polite">
              {visible.length === guests.length
                ? `${guests.length} khách`
                : `${visible.length} / ${guests.length} khách`}
            </p>
            {filtered && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={clearFilters}
              >
                Bỏ lọc
              </Button>
            )}
            {filtered && unsentVisible.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={markVisibleSent}
              >
                <Send /> Đánh dấu {unsentVisible.length} khách đã gửi
              </Button>
            )}
          </div>
          {visible.length === 0 && (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Không có khách nào khớp bộ lọc.
            </p>
          )}
          <ul className="divide-y rounded-xl border bg-card">
            {visible.map((g) => (
              <GuestRow
                key={g.code}
                guest={g}
                rsvp={rsvpByCode.get(g.code)}
                onCopyLink={async () => {
                  if (
                    await copyText(guestLink(origin, g.code), `Đã chép link của ${g.displayName}`)
                  )
                    markSent(g)
                }}
                onCopyMessage={async () => {
                  if (await copyText(messageFor(g), 'Đã chép tin nhắn mời')) markSent(g)
                }}
                onShare={
                  shareable
                    ? async () => {
                        if (await shareText(messageFor(g))) markSent(g)
                      }
                    : undefined
                }
                onToggleSent={() => void toggleSent(g)}
                onQr={() => setQrTarget({ name: g.displayName, link: guestLink(origin, g.code) })}
                onEdit={() => setEditing(g)}
                onDelete={() => setDeleting(g)}
              />
            ))}
          </ul>
        </>
      )}

      <GuestDialog
        open={editing !== null}
        onOpenChange={(next) => !next && setEditing(null)}
        guest={editing && editing !== 'new' ? editing : undefined}
        newCode={newCode}
        groups={groups}
      />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} existingCodes={codes} />
      <MessageDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
        template={template}
        sample={{
          name: guests?.[0]?.displayName ?? 'Anh Nam',
          link: guestLink(origin, guests?.[0]?.code ?? 'abc234'),
          groom: wedding.groom.shortName,
          bride: wedding.bride.shortName,
        }}
        onSave={onSave}
      />
      <QrDialog target={qrTarget} onOpenChange={(next) => !next && setQrTarget(null)} />
      <AlertDialog open={deleting !== null} onOpenChange={(next) => !next && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá {deleting?.displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Link thiệp riêng của khách này sẽ không mở được nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Giữ lại</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Xoá khách
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: [string, string][]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, text]) => (
          <SelectItem key={v} value={v}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function GuestRow({
  guest,
  rsvp,
  onCopyLink,
  onCopyMessage,
  onShare,
  onToggleSent,
  onQr,
  onEdit,
  onDelete,
}: {
  guest: AdminGuest
  rsvp?: AdminRsvp
  onCopyLink: () => void
  onCopyMessage: () => void
  onShare?: () => void
  onToggleSent: () => void
  onQr: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const opened = guest.firstOpenedAt
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{guest.displayName}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span
            className={cn(
              'rounded-full px-2 py-0.5',
              guest.side === 'groom'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-accent text-accent-foreground',
            )}
          >
            {SIDE_LABEL[guest.side]}
          </span>
          {guest.group && <span>{guest.group}</span>}
          {guest.maxAttendees && <span>{guest.maxAttendees} người</span>}
          <span className="font-mono">/m/{guest.code}</span>
        </p>
        {rsvp && (
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              rsvp.attending ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {rsvp.attending ? `✓ Sẽ đến · ${rsvp.count} người` : '✕ Không đến được'}
            {rsvp.note && (
              <span className="ml-1 font-normal text-muted-foreground italic">“{rsvp.note}”</span>
            )}
          </p>
        )}
      </div>
      {opened ? (
        <p
          className="flex items-center gap-1.5 text-xs text-gold sm:w-44"
          title={
            guest.lastOpenedAt
              ? `Mở gần nhất ${openedFormat.format(guest.lastOpenedAt)}`
              : undefined
          }
        >
          <span aria-hidden className="size-1.5 rounded-full bg-gold" />
          Đã mở {guest.openCount ?? 1} lần · {openedFormat.format(opened)}
        </p>
      ) : (
        <button
          type="button"
          onClick={onToggleSent}
          title={guest.sentAt ? 'Bấm để bỏ đánh dấu đã gửi' : 'Bấm để đánh dấu đã gửi'}
          className={cn(
            '-mx-1.5 flex w-fit items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left text-xs transition outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 sm:w-44',
            guest.sentAt ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <span
            aria-hidden
            className={cn('size-1.5 rounded-full', guest.sentAt ? 'bg-primary' : 'bg-border')}
          />
          {guest.sentAt
            ? `Đã gửi ${openedFormat.format(guest.sentAt).split(' ')[0]} · chưa mở`
            : 'Chưa gửi · đánh dấu đã gửi'}
        </button>
      )}
      <div className="flex gap-1">
        {onShare && (
          <IconButton label="Chia sẻ (Zalo, Messenger…)" onClick={onShare}>
            <Share2 />
          </IconButton>
        )}
        <IconButton label="Chép tin nhắn mời" onClick={onCopyMessage}>
          <MessageSquareText />
        </IconButton>
        {/* Thao tác ít dùng gom vào menu để dòng khách gọn, khó bấm nhầm trên điện thoại */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Thao tác khác"
              aria-label={`Thao tác khác cho ${guest.displayName}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onCopyLink}>
              <Link2 /> Chép link
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onQr}>
              <QrCode /> Mã QR
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/m/${guest.code}?preview&motion=full`} target="_blank" rel="noreferrer">
                <ExternalLink /> Xem thiệp như khách
              </a>
            </DropdownMenuItem>
            {!opened && (
              <DropdownMenuItem onSelect={onToggleSent}>
                <Send /> {guest.sentAt ? 'Bỏ đánh dấu đã gửi' : 'Đánh dấu đã gửi'}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil /> Sửa
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 /> Xoá khách
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  )
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
    </Button>
  )
}
