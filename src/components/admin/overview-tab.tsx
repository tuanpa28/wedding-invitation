'use client'

import {
  ArrowRight,
  CalendarHeart,
  Check,
  Copy,
  DatabaseBackup,
  Download,
  ExternalLink,
  Eye,
  HeartHandshake,
  MapPin,
  MessageCircleHeart,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { nextEvent, recentActivity, setupChecklist, type Activity } from '@/lib/admin-overview'
import { relativeTime, rsvpStats } from '@/lib/feedback'
import { eventDateParts } from '@/lib/invitation/helpers'
import { useSiteOrigin } from '@/lib/use-origin'
import { cn } from '@/lib/utils'
import { useAdminData } from './admin-data'
import { downloadBackup } from './backup'
import { copyText } from './copy'
import type { EditorFormProps } from './editor-types'
import type { TabId } from './wedding-editor'

/** Màn hình đầu tiên: còn bao lâu tới ngày cưới, số liệu chính, việc cần làm, hoạt động mới */
export function OverviewTab({ wedding, goTo }: EditorFormProps & { goTo: (tab: TabId) => void }) {
  const { guests, rsvps, wishes } = useAdminData()
  const origin = useSiteOrigin()
  const link = origin ? `${origin}/` : '/'

  // Cập nhật "5 phút trước" và số ngày còn lại mỗi phút
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const next = nextEvent(wedding.events, now)
  const stats = useMemo(() => {
    const list = guests ?? []
    const r = rsvpStats(
      rsvps ?? [],
      list.map((g) => g.code),
    )
    return {
      guests: list.length,
      people: list.reduce((sum, g) => sum + (g.maxAttendees ?? 1), 0),
      opened: list.filter((g) => g.firstOpenedAt).length,
      sent: list.filter((g) => g.sentAt || g.firstOpenedAt).length,
      attending: r.people,
      responses: r.responses,
      pending: r.pendingGuests,
      wishes: wishes?.filter((w) => !w.hidden).length ?? 0,
    }
  }, [guests, rsvps, wishes])

  const activity = useMemo(
    () => (guests && rsvps && wishes ? recentActivity({ guests, rsvps, wishes }) : null),
    [guests, rsvps, wishes],
  )
  const checklist = setupChecklist(wedding, {
    total: stats.guests,
    unsent: stats.guests - stats.sent,
  })
  const required = checklist.filter((c) => !c.optional)
  const ready = required.every((c) => c.done)
  const doneCount = checklist.filter((c) => c.done).length
  const loading = guests === null || rsvps === null || wishes === null

  return (
    <div className="grid gap-6 pb-10">
      {/* Ngày cưới + link chung */}
      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="grid gap-6 bg-linear-to-br from-primary/10 via-transparent to-gold-soft/40 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <Countdown daysLeft={next?.daysLeft} />
          <div className="min-w-0">
            {next ? (
              <>
                <p className="text-xs font-medium tracking-wide text-primary uppercase">
                  {next.daysLeft < 0 ? 'Sự kiện gần nhất đã qua' : 'Sự kiện sắp tới'}
                </p>
                <p className="mt-1 font-display text-2xl tracking-tight">{next.event.title}</p>
                <EventLine iso={next.event.startAt} venue={next.event.venue} />
              </>
            ) : (
              <>
                <p className="font-display text-2xl tracking-tight">Chưa có ngày cưới</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Thêm lịch các buổi lễ để khách biết ngày giờ và đường đi.
                </p>
                <Button className="mt-3" size="sm" onClick={() => goTo('events')}>
                  Thêm sự kiện <ArrowRight />
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:items-center">
          <label htmlFor="general-link" className="shrink-0 text-sm font-medium">
            Link thiệp chung
          </label>
          <div className="flex min-w-0 flex-1 gap-2">
            <Input
              id="general-link"
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => copyText(link, 'Đã chép link thiệp chung')}
            >
              <Copy /> Chép
            </Button>
            <Button asChild variant="ghost" size="icon" title="Mở thiệp">
              <a href="/?preview&motion=full" target="_blank" rel="noreferrer">
                <ExternalLink />
                <span className="sr-only">Mở thiệp ở tab mới</span>
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Số liệu chính */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={HeartHandshake}
          label="Khách mời"
          value={stats.guests}
          hint={
            stats.guests ? `khoảng ${stats.people} người · đã gửi ${stats.sent}` : 'chưa thêm khách'
          }
          loading={loading}
          onClick={() => goTo('guests')}
        />
        <Stat
          icon={Eye}
          label="Đã mở thiệp"
          value={stats.opened}
          hint={
            stats.guests
              ? `${Math.round((stats.opened / stats.guests) * 100)}% khách · ${stats.guests - stats.sent} chưa gửi`
              : 'tính theo link riêng'
          }
          loading={loading}
          onClick={() => goTo('guests')}
        />
        <Stat
          icon={CalendarHeart}
          label="Sẽ đến"
          value={stats.attending}
          hint={`${stats.responses} phản hồi · ${stats.pending} khách chưa trả lời`}
          loading={loading}
          accent
          onClick={() => goTo('feedback')}
        />
        <Stat
          icon={MessageCircleHeart}
          label="Lời chúc"
          value={stats.wishes}
          hint="đang hiện trên thiệp"
          loading={loading}
          onClick={() => goTo('feedback')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Việc cần làm */}
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl tracking-tight">
              {ready ? 'Thiệp đã sẵn sàng gửi' : 'Chuẩn bị thiệp'}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {doneCount}/{checklist.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${(doneCount / checklist.length) * 100}%` }}
            />
          </div>
          <ul className="mt-4 grid gap-1">
            {checklist.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => goTo(item.tab)}
                  className="group flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  <span
                    className={cn(
                      'grid size-5 shrink-0 place-items-center rounded-full border',
                      item.done
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/40',
                    )}
                  >
                    {item.done && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block text-sm',
                        item.done ? 'text-muted-foreground' : 'font-medium',
                      )}
                    >
                      {item.label}
                      {item.optional && !item.done && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          (tuỳ chọn)
                        </span>
                      )}
                    </span>
                    {!item.done && (
                      <span className="block text-xs text-muted-foreground">{item.hint}</span>
                    )}
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Hoạt động gần đây */}
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-xl tracking-tight">Hoạt động gần đây</h2>
          {activity === null ? (
            <div className="mt-4 grid gap-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Chưa có gì mới. Khi khách mở thiệp, xác nhận tham dự hay gửi lời chúc, bạn sẽ thấy ở
              đây ngay.
            </p>
          ) : (
            <ul className="mt-3 grid gap-1">
              {activity.map((a, i) => (
                <ActivityRow key={i} activity={a} now={now} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Sao lưu */}
      <section className="flex flex-col gap-3 rounded-2xl border border-dashed p-5 sm:flex-row sm:items-center">
        <DatabaseBackup className="size-6 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">Sao lưu dữ liệu</h2>
          <p className="text-sm text-muted-foreground">
            Tải một file chứa nội dung thiệp, danh sách khách, phản hồi và lời chúc. Nên tải sau
            ngày cưới và cất ở nơi riêng tư, vì file có danh sách khách và số tài khoản.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() =>
            downloadBackup({
              wedding,
              guests: guests ?? [],
              rsvps: rsvps ?? [],
              wishes: wishes ?? [],
            })
          }
        >
          <Download /> Tải bản sao lưu
        </Button>
      </section>
    </div>
  )
}

function Countdown({ daysLeft }: { daysLeft?: number }) {
  const big =
    daysLeft === undefined ? '—' : daysLeft > 0 ? String(daysLeft) : daysLeft === 0 ? '♥' : '✓'
  const small =
    daysLeft === undefined
      ? 'chưa đặt ngày'
      : daysLeft > 1
        ? 'ngày nữa'
        : daysLeft === 1
          ? 'ngày mai'
          : daysLeft === 0
            ? 'hôm nay'
            : 'đã diễn ra'
  return (
    <div className="grid size-28 shrink-0 place-content-center rounded-full border-2 border-primary/25 bg-background text-center shadow-sm">
      <span className="font-display text-4xl leading-none text-primary tabular-nums">{big}</span>
      <span className="mt-1 text-xs text-muted-foreground">{small}</span>
    </div>
  )
}

function EventLine({ iso, venue }: { iso: string; venue: string }) {
  const d = eventDateParts(iso)
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
      <span>
        {d.time} · {d.weekday}, {d.day}/{d.month}/{d.year}
      </span>
      {venue && (
        <span className="flex items-center gap-1">
          <MapPin className="size-3.5" /> {venue}
        </span>
      )}
    </p>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  accent = false,
  onClick,
}: {
  icon: typeof Eye
  label: string
  value: number
  hint: string
  loading: boolean
  accent?: boolean
  onClick: () => void
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex h-full w-full flex-col rounded-xl border bg-card p-4 text-left transition outline-none hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/40',
          accent && 'border-gold/30 bg-gold-soft/40',
        )}
      >
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" /> {label}
        </span>
        <span className="mt-2 block">
          {loading ? (
            <span className="block h-9 w-12 animate-pulse rounded bg-muted" />
          ) : (
            <span
              className={cn(
                'font-display text-4xl leading-none tabular-nums',
                accent && 'text-gold',
              )}
            >
              {value}
            </span>
          )}
          <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>
        </span>
      </button>
    </div>
  )
}

function ActivityRow({ activity: a, now }: { activity: Activity; now: number }) {
  const text =
    a.kind === 'open'
      ? a.count > 1
        ? `mở thiệp (lần ${a.count})`
        : 'mở thiệp'
      : a.kind === 'rsvp'
        ? a.attending
          ? `sẽ đến · ${a.people} người`
          : 'báo không đến được'
        : 'gửi lời chúc'
  const dot =
    a.kind === 'open' ? 'bg-gold' : a.kind === 'rsvp' ? 'bg-primary' : 'bg-muted-foreground'
  return (
    <li className="flex gap-3 rounded-lg px-2 py-2">
      <span aria-hidden className={cn('mt-1.5 size-2 shrink-0 rounded-full', dot)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{a.name}</span> {text}
        </p>
        {a.kind === 'wish' && (
          <p className="truncate text-xs text-muted-foreground italic">“{a.message}”</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(a.at, now)}</span>
    </li>
  )
}
