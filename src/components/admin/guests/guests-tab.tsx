'use client'

import {
  FileDown,
  FileUp,
  Link2,
  MessageSquareText,
  Pencil,
  Plus,
  QrCode,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { deleteGuest, subscribeGuests, type AdminGuest } from '@/lib/firebase/admin-client'
import { DEFAULT_INVITE_MESSAGE, generateGuestCode, guestLink, inviteMessage } from '@/lib/guests'
import { SIDE_LABEL } from '@/lib/invitation/helpers'
import { slugify } from '@/lib/invitation/slug'
import { useOrigin } from '@/lib/use-origin'
import { cn } from '@/lib/utils'
import { errorMessage, type EditorFormProps } from '../editor-types'
import { GuestDialog } from './guest-dialog'
import { exportGuests } from './guest-excel'
import { ImportDialog } from './import-dialog'
import { MessageDialog } from './message-dialog'
import { QrDialog } from './qr-dialog'

type SideFilter = 'all' | 'groom' | 'bride'
type OpenFilter = 'all' | 'opened' | 'unopened'

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

async function copyText(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(done)
  } catch {
    toast.error('Không chép được, hãy chọn và chép tay')
  }
}

/** Quản lý khách mời: danh sách realtime, link riêng, QR, tin nhắn mời, nhập/xuất Excel */
export function GuestsTab({ wedding, onSave }: EditorFormProps) {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL
  const pageOrigin = useOrigin()
  const origin = envOrigin || pageOrigin

  const [guests, setGuests] = useState<AdminGuest[] | null>(null)
  const [query, setQuery] = useState('')
  const [side, setSide] = useState<SideFilter>('all')
  const [opened, setOpened] = useState<OpenFilter>('all')
  const [group, setGroup] = useState('all')

  const [editing, setEditing] = useState<AdminGuest | 'new' | null>(null)
  const [newCode, setNewCode] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)
  const [qrTarget, setQrTarget] = useState<{ name: string; link: string } | null>(null)
  const [deleting, setDeleting] = useState<AdminGuest | null>(null)

  useEffect(
    () =>
      subscribeGuests(setGuests, (error) => {
        toast.error(errorMessage(error, 'Không tải được danh sách khách'))
        setGuests([])
      }),
    [],
  )

  const codes = useMemo(() => new Set(guests?.map((g) => g.code)), [guests])
  const groups = useMemo(
    () =>
      [...new Set(guests?.flatMap((g) => (g.group ? [g.group] : [])))].sort((a, b) =>
        a.localeCompare(b, 'vi'),
      ),
    [guests],
  )

  const visible = useMemo(() => {
    const q = slugify(query)
    return (guests ?? []).filter(
      (g) =>
        (side === 'all' || g.side === side) &&
        (opened === 'all' || (opened === 'opened') === Boolean(g.firstOpenedAt)) &&
        (group === 'all' || g.group === group) &&
        (!q || slugify(`${g.displayName} ${g.group ?? ''} ${g.code}`).includes(q)),
    )
  }, [guests, query, side, opened, group])

  const stats = useMemo(() => {
    const list = guests ?? []
    const people = (g: AdminGuest) => g.maxAttendees ?? 1
    return {
      total: list.length,
      groom: list.filter((g) => g.side === 'groom').length,
      bride: list.filter((g) => g.side === 'bride').length,
      opened: list.filter((g) => g.firstOpenedAt).length,
      people: list.reduce((sum, g) => sum + people(g), 0),
    }
  }, [guests])

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
      {/* Thống kê */}
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Khách mời" value={stats.total} hint={`~${stats.people} người`} />
        <Stat label="Nhà trai" value={stats.groom} />
        <Stat label="Nhà gái" value={stats.bride} />
        <Stat
          label="Đã mở thiệp"
          value={stats.opened}
          hint={stats.total ? `${Math.round((stats.opened / stats.total) * 100)}%` : undefined}
          accent
        />
      </dl>

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
      <div className="grid grid-cols-3 gap-2">
        <label className="relative col-span-3">
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
          label="Trạng thái"
          value={opened}
          onChange={(v) => setOpened(v as OpenFilter)}
          options={[
            ['all', 'Mọi trạng thái'],
            ['opened', 'Đã mở thiệp'],
            ['unopened', 'Chưa mở'],
          ]}
        />
        <FilterSelect
          label="Nhóm"
          value={group}
          onChange={setGroup}
          options={[['all', 'Mọi nhóm'], ...groups.map((g) => [g, g] as [string, string])]}
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
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {visible.length === guests.length
              ? `${guests.length} khách`
              : `${visible.length} / ${guests.length} khách`}
          </p>
          <ul className="divide-y rounded-xl border bg-card">
            {visible.map((g) => (
              <GuestRow
                key={g.code}
                guest={g}
                onCopyLink={() =>
                  copyText(guestLink(origin, g.code), `Đã chép link của ${g.displayName}`)
                }
                onCopyMessage={() => copyText(messageFor(g), 'Đã chép tin nhắn mời')}
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

function Stat({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string
  value: number
  hint?: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card px-4 py-3',
        accent && 'border-gold/30 bg-gold-soft/50',
      )}
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-2">
        <span className={cn('font-display text-3xl', accent && 'text-gold')}>{value}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </dd>
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
  onCopyLink,
  onCopyMessage,
  onQr,
  onEdit,
  onDelete,
}: {
  guest: AdminGuest
  onCopyLink: () => void
  onCopyMessage: () => void
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
      </div>
      <p
        className={cn(
          'flex items-center gap-1.5 text-xs sm:w-44',
          opened ? 'text-gold' : 'text-muted-foreground',
        )}
        title={
          guest.lastOpenedAt ? `Mở gần nhất ${openedFormat.format(guest.lastOpenedAt)}` : undefined
        }
      >
        <span
          aria-hidden
          className={cn('size-1.5 rounded-full', opened ? 'bg-gold' : 'bg-border')}
        />
        {opened
          ? `Đã mở ${guest.openCount ?? 1} lần · ${openedFormat.format(opened)}`
          : 'Chưa mở thiệp'}
      </p>
      <div className="flex gap-1">
        <IconButton label="Chép link" onClick={onCopyLink}>
          <Link2 />
        </IconButton>
        <IconButton label="Chép tin nhắn mời" onClick={onCopyMessage}>
          <MessageSquareText />
        </IconButton>
        <IconButton label="Mã QR" onClick={onQr}>
          <QrCode />
        </IconButton>
        <IconButton label="Sửa" onClick={onEdit}>
          <Pencil />
        </IconButton>
        <IconButton label="Xoá" onClick={onDelete}>
          <Trash2 />
        </IconButton>
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
