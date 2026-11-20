import { Leaf } from 'lucide-react'
import { Dancing_Script, Quicksand } from 'next/font/google'
import { WeddingImage as Image } from '@/components/invitation/wedding-image'
import type { CSSProperties, ReactNode } from 'react'
import { Album } from '@/components/invitation/album'
import { Countdown } from '@/components/invitation/countdown'
import { EventActions } from '@/components/invitation/event-actions'
import { GiftSection, hasGiftAccounts } from '@/components/invitation/feedback/gift-section'
import { RsvpForm } from '@/components/invitation/feedback/rsvp-form'
import { feedbackTheme } from '@/components/invitation/feedback/styles'
import { WishesBoard } from '@/components/invitation/feedback/wishes-board'
import { rsvpState } from '@/lib/feedback'
import {
  CoverOverlay,
  InvitationShell,
  OpenInvitationButton,
} from '@/components/invitation/invitation-shell'
import {
  AnimatedText,
  FallingParticles,
  HeroItem,
  ParallaxImage,
} from '@/components/invitation/motion'
import { Reveal } from '@/components/invitation/reveal'
import {
  eventDateParts,
  inviteeInSentence,
  inviteeName,
  SIDE_LABEL,
} from '@/lib/invitation/helpers'
import type { WeddingEvent } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'
import type { TemplateProps } from '../types'

// Hoa Cỏ — pastel đồng quê: xanh lá xám, hồng phấn, tím bằng lăng.
// Điểm nhấn: cành hoa dại vẽ nét, tự "mọc" khi cuộn tới. Phong bì bồng bềnh; bấm con dấu
// thì vạt thư lật lên, tấm thiệp trượt ra, tên hiện như viết tay, cánh hoa và lá bay.

const script = Dancing_Script({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-hc-script',
  display: 'swap',
  preload: false,
})

const rounded = Quicksand({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-hc-body',
  display: 'swap',
  preload: false,
})

const palette = {
  '--hc-bg': '#f1f4ea',
  '--hc-card': '#fbfcf7',
  '--hc-leaf': '#4a5e42',
  '--hc-sage': '#91a584',
  // Màu chữ phụ: đủ tương phản (≥ 4.5:1) trên nền --hc-bg
  '--hc-moss': '#586c50',
  '--hc-blush': '#e8c3bb',
  '--hc-blush-deep': '#d9a89e',
  '--hc-lilac': '#b4a2cf',
  '--hc-butter': '#f0d89d',
  '--hc-ink': '#36412f',
} as CSSProperties

// Form RSVP / sổ lưu bút: bo tròn mềm, nút xanh lá
const feedback = feedbackTheme({
  accent: 'var(--hc-leaf)',
  onAccent: 'var(--hc-card)',
  ink: 'var(--hc-ink)',
  muted: 'var(--hc-moss)',
  card: 'var(--hc-card)',
  line: 'rgb(145 165 132 / 0.55)',
  radius: '1.25rem',
})

export default function HoaCoTemplate({
  invitation,
  guest,
  events,
  featured,
  couple,
}: TemplateProps) {
  const date = featured && eventDateParts(featured.startAt)

  return (
    <InvitationShell
      musicUrl={invitation.musicUrl}
      openDuration={1700}
      style={palette}
      className={cn(
        script.variable,
        rounded.variable,
        'min-h-svh overflow-x-clip bg-(--hc-bg) font-(family-name:--font-hc-body) font-medium text-(--hc-ink) antialiased',
      )}
      musicButtonClassName="bg-(--hc-leaf) text-(--hc-card) focus-visible:ring-(--hc-lilac)"
    >
      {/* ---------- Phong bì có con dấu sáp ---------- */}
      <CoverOverlay className="bg-(--hc-bg) transition-opacity delay-[1000ms] duration-700 group-data-[phase=opening]/inv:opacity-0">
        <div className="flex h-full flex-col items-center justify-center gap-10 px-6 text-center">
          <div>
            <p className="text-sm tracking-[0.3em] text-(--hc-moss) uppercase">Gửi tới</p>
            <p className="mt-2 font-(family-name:--font-hc-script) text-5xl leading-[1.25] text-(--hc-leaf)">
              {inviteeName(guest)}
            </p>
          </div>

          <div className="th-float relative aspect-[3/2] w-[min(80vw,340px)] [perspective:900px] group-data-[phase=opening]/inv:[animation-play-state:paused]">
            <div className="absolute inset-0 rounded-lg bg-(--hc-blush) shadow-[0_18px_40px_-20px_rgba(74,94,66,0.55)]" />
            {/* Tấm thiệp bên trong: trượt lên khỏi phong bì sau khi vạt trên lật */}
            <div className="absolute inset-x-[9%] top-[10%] h-[82%] rounded-md bg-(--hc-card) shadow-[0_6px_16px_-8px_rgba(54,65,47,0.45)] transition-transform delay-[450ms] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[phase=opening]/inv:-translate-y-[78%]">
              <p className="pt-3 text-center font-(family-name:--font-hc-script) text-xl text-(--hc-leaf)">
                Thiệp mời
              </p>
            </div>
            {/* Hai vạt bên + vạt dưới (màu đặc để che tấm thiệp bên trong) */}
            <div className="absolute inset-0 rounded-lg bg-[#e3b8ae] [clip-path:polygon(0_0,50%_55%,0_100%)]" />
            <div className="absolute inset-0 rounded-lg bg-[#e3b8ae] [clip-path:polygon(100%_0,50%_55%,100%_100%)]" />
            <div className="absolute inset-0 rounded-lg bg-[#e6bfb6] [clip-path:polygon(0_100%,50%_50%,100%_100%)]" />
            {/* Vạt trên — lật lên khi mở. Lật xong thì xuống dưới tấm thiệp (z-index đổi giữa chừng,
                lúc vạt đang dựng đứng) để tấm thiệp trượt lên không bị vạt che */}
            <div className="absolute inset-x-0 top-0 z-10 h-[58%] origin-top rounded-t-lg bg-(--hc-blush-deep) transition-[transform,z-index] duration-700 ease-out [clip-path:polygon(0_0,100%_0,50%_100%)] group-data-[phase=opening]/inv:-z-10 group-data-[phase=opening]/inv:[transform:rotateX(180deg)]" />
            <OpenInvitationButton className="absolute top-[58%] left-1/2 z-20 grid size-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-(--hc-lilac) text-(--hc-card) shadow-[inset_0_-4px_0_rgba(0,0,0,0.12),0_6px_14px_-6px_rgba(54,65,47,0.6)] transition group-data-[phase=opening]/inv:scale-0 hover:scale-105 focus-visible:ring-2 focus-visible:ring-(--hc-leaf) focus-visible:ring-offset-4 focus-visible:ring-offset-(--hc-bg) focus-visible:outline-none">
              <Leaf className="size-7" aria-hidden />
              <span className="sr-only">Mở thiệp</span>
            </OpenInvitationButton>
          </div>

          <p className="text-sm text-(--hc-ink)/80">Chạm vào con dấu để mở thiệp</p>
        </div>
      </CoverOverlay>

      {/* ---------- Đầu thiệp ---------- */}
      <Reveal plain as="header" className="group/grow relative px-6 pt-16 pb-14 text-center">
        <Sprig className="absolute top-28 -left-7 h-48 w-24 -scale-x-100" />
        <Sprig className="absolute top-28 -right-7 h-48 w-24" />
        <HeroItem delay={0.9} variant="fade">
          <p className="text-xs tracking-[0.35em] text-(--hc-moss) uppercase">Ngày chung đôi</p>
        </HeroItem>
        <h1 className="relative mt-5 font-(family-name:--font-hc-script) text-6xl leading-[1.2] text-(--hc-leaf) md:text-8xl">
          <AnimatedText mode="write" text={couple[0].shortName} delay={1.1} className="block" />
          <HeroItem delay={1.9} variant="zoom" className="block text-4xl text-(--hc-lilac)">
            &amp;
          </HeroItem>
          <AnimatedText mode="write" text={couple[1].shortName} delay={2.1} className="block" />
        </h1>

        <HeroItem
          delay={1.3}
          variant="zoom"
          className="relative mx-auto mt-10 aspect-[4/5] w-60 md:w-72"
        >
          {/* Ảnh oval kiểu cameo, viền chỉ mảnh và cành ô liu nét mảnh (vẽ ra sau khi mở thiệp) */}
          <div className="absolute inset-[8%] overflow-hidden rounded-[50%] shadow-[0_22px_40px_-26px_rgba(54,65,47,0.8)]">
            <ParallaxImage className="size-full" strength={16} delay={1.3}>
              <Image
                src={invitation.cover.src}
                alt={invitation.cover.alt}
                fill
                loading="eager"
                fetchPriority="high"
                sizes="(min-width: 768px) 248px, 206px"
                className="object-cover"
              />
            </ParallaxImage>
          </div>
          <CameoFrame className="absolute inset-0 size-full" />
        </HeroItem>

        {featured && date && (
          <>
            <div className="mx-auto mt-10 grid max-w-xs grid-cols-3 items-center text-sm">
              <span>{date.weekday}</span>
              <span className="border-x border-(--hc-sage)/60 py-2 text-2xl font-semibold text-(--hc-leaf)">
                {date.day}.{date.month}
              </span>
              <span>{date.time}</span>
            </div>
            <p className="mt-2 text-sm">năm {date.year}</p>
            {featured.lunarText && (
              <p className="mt-1 text-xs text-(--hc-ink)/80">{featured.lunarText}</p>
            )}
          </>
        )}
        {invitation.quote && (
          <p className="relative mx-auto mt-8 max-w-xs font-(family-name:--font-hc-script) text-2xl leading-snug text-(--hc-leaf)">
            “{invitation.quote}”
          </p>
        )}
      </Reveal>

      <main className="mx-auto max-w-md space-y-8 px-5 pb-16 md:max-w-3xl">
        {/* ---------- Lời mời ---------- */}
        <Card>
          <Heading>Thư mời</Heading>
          <p className="mt-5 leading-relaxed">
            Trân trọng kính mời{' '}
            <span className="font-semibold text-(--hc-leaf)">{inviteeInSentence(guest)}</span> tới
            chung vui trong ngày trọng đại của chúng mình.
          </p>
          <div className="mt-8 grid gap-4 text-sm leading-relaxed min-[420px]:grid-cols-2">
            {couple.map((person) => (
              <div key={person.fullName} className="rounded-2xl bg-(--hc-bg) px-3 py-4">
                <p className="text-xs tracking-[0.25em] text-(--hc-moss) uppercase">
                  {SIDE_LABEL[person === invitation.groom ? 'groom' : 'bride']}
                </p>
                {person.father && <p className="mt-2">{person.father}</p>}
                {person.mother && <p>{person.mother}</p>}
                <p className="mt-3 font-(family-name:--font-hc-script) text-2xl leading-snug text-(--hc-leaf)">
                  {person.fullName}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* ---------- Đếm ngược + sự kiện (link chung chưa có lễ chung thì không có) ---------- */}
        {featured && (
          <>
            <Card>
              <Heading>Đếm từng ngày</Heading>
              <Countdown
                target={featured.startAt}
                className="mx-auto mt-6 max-w-md gap-2"
                itemClassName="aspect-square justify-center rounded-full bg-(--hc-blush)/45"
                numberClassName="text-2xl font-semibold text-(--hc-leaf)"
                labelClassName="text-[0.7rem] text-(--hc-ink)/80"
              />
            </Card>

            {/* ---------- Sự kiện ---------- */}
            <section>
              <Heading className="mb-6 pt-4">Lễ cưới</Heading>
              <div className={cn('grid gap-4', events.length > 1 && 'md:grid-cols-2')}>
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* ---------- Album ---------- */}
        {invitation.gallery.length > 0 && (
          <section>
            <Heading className="mb-6 pt-4">Khoảnh khắc</Heading>
            <Album
              wide
              photos={invitation.gallery}
              itemClassName="overflow-hidden rounded-2xl"
              imageClassName="rounded-2xl"
            />
          </section>
        )}
      </main>

      {/* ---------- Xác nhận tham dự + sổ lưu bút ---------- */}
      <div className="mx-auto max-w-md space-y-8 px-5 pb-16 md:max-w-xl" style={feedback}>
        {rsvpState(invitation) !== 'disabled' && (
          <Card>
            <Heading>Xác nhận tham dự</Heading>
            <div className="mt-6">
              <RsvpForm invitation={invitation} guest={guest} />
            </div>
          </Card>
        )}
        {invitation.wishesEnabled !== false && (
          <section>
            <Heading className="mb-6 pt-4">Sổ lưu bút</Heading>
            <WishesBoard guest={guest} />
          </section>
        )}
      </div>

      {hasGiftAccounts(invitation) && (
        <div className="mx-auto max-w-md px-5 pb-16 md:max-w-3xl" style={feedback}>
          <Card>
            <Heading>Mừng cưới</Heading>
            <div className="mt-6">
              <GiftSection invitation={invitation} guest={guest} />
            </div>
          </Card>
        </div>
      )}

      {/* ---------- Lời cảm ơn ---------- */}
      <Reveal
        plain
        as="footer"
        className="group/grow relative overflow-hidden px-6 pt-10 pb-24 text-center"
      >
        <Sprig className="absolute bottom-6 left-1/2 h-40 w-20 -translate-x-[150%] -scale-x-100" />
        <Sprig className="absolute bottom-6 left-1/2 h-40 w-20 translate-x-1/2" />
        <p className="relative font-(family-name:--font-hc-script) text-4xl leading-snug text-(--hc-leaf)">
          Hẹn gặp {inviteeInSentence(guest)}
          <br />
          trong ngày vui!
        </p>
        <p className="relative mt-4 text-sm">
          {couple[0].shortName} &amp; {couple[1].shortName}
        </p>
        <p className="relative mt-12 text-[0.7rem] tracking-[0.3em] text-(--hc-moss) uppercase">
          Thiệp Hồng
        </p>
      </Reveal>
      <FallingParticles
        shapes={['petal', 'leaf', 'petal']}
        colors={['#e8c3bb', '#b4a2cf', '#91a584', '#d9a89e']}
        count={12}
      />
    </InvitationShell>
  )
}

/* ---------------------------------------------------------------- */

function Card({ children }: { children: ReactNode }) {
  return (
    <Reveal
      as="section"
      className="rounded-[2rem] bg-(--hc-card) px-6 py-8 text-center shadow-[0_14px_34px_-22px_rgba(74,94,66,0.45)]"
    >
      {children}
    </Reveal>
  )
}

function Heading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'flex items-center justify-center gap-3 font-(family-name:--font-hc-script) text-4xl text-(--hc-leaf)',
        className,
      )}
    >
      <Leaf className="size-4 -scale-x-100 text-(--hc-moss)" aria-hidden />
      {children}
      <Leaf className="size-4 text-(--hc-moss)" aria-hidden />
    </h2>
  )
}

function EventCard({ event }: { event: WeddingEvent }) {
  const d = eventDateParts(event.startAt)
  return (
    <Reveal className="rounded-[2rem] bg-(--hc-card) px-6 py-7 text-center shadow-[0_14px_34px_-22px_rgba(74,94,66,0.45)]">
      <h3 className="font-(family-name:--font-hc-script) text-3xl text-(--hc-leaf)">
        {event.title}
      </h3>
      <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-(--hc-blush)/45 px-4 py-1.5 text-sm">
        <span className="font-semibold">{d.time}</span>
        <span aria-hidden>·</span>
        <span>
          {d.weekday}, {d.date}
        </span>
      </p>
      {event.lunarText && <p className="mt-2 text-xs text-(--hc-ink)/80">{event.lunarText}</p>}
      <p className="mt-4 text-base font-semibold">{event.venue}</p>
      <p className="mt-1 text-sm leading-relaxed text-(--hc-ink)/80">{event.address}</p>
      <EventActions
        event={event}

        className="mt-5 justify-center"
        buttonClassName="rounded-full bg-(--hc-leaf) font-semibold text-(--hc-card) hover:bg-(--hc-ink) focus-visible:ring-(--hc-leaf)"
      />
    </Reveal>
  )
}

/** Điểm trên elip tâm (100, 125) của khung cameo, góc tính từ đỉnh theo chiều kim đồng hồ */
const ovalPoint = (deg: number, rx: number, ry: number) => {
  const rad = (deg * Math.PI) / 180
  return [100 + rx * Math.sin(rad), 125 - ry * Math.cos(rad)] as const
}

/** Lá ô liu nét mảnh (chỉ viền + gân giữa), gốc ở (0, 0), mũi lá hướng lên */
const OLIVE_LEAF = 'M0 0 C 3.2 -3.5, 3.2 -9, 0 -13 C -3.2 -9, -3.2 -3.5, 0 0 Z M0 -1.5 L0 -11'

/** Cành ô liu chạy dọc viền elip từ góc `from` tới `to`, lá xen kẽ hai bên */
function oliveBranch(from: number, to: number, rx: number, ry: number) {
  const steps = 24
  const points = Array.from({ length: steps + 1 }, (_, i) =>
    ovalPoint(from + ((to - from) * i) / steps, rx, ry),
  )
  const stem = `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}`
  // Lá ở các điểm cách đều (bỏ đoạn gốc), hướng theo chiều mọc của cành, nghiêng ra hai bên
  const leaves = points.flatMap(([x, y], i) => {
    if (i < 2 || i % 2 || i === steps) return []
    const [nx, ny] = points[i + 1]
    const along = (Math.atan2(nx - x, -(ny - y)) * 180) / Math.PI
    const tilt = (i / 2) % 2 ? 42 : -42
    return [{ x, y, rotate: along + tilt, scale: 0.75 + (0.35 * i) / steps }]
  })
  return { stem, leaves, tip: points[steps] }
}

/**
 * Khung ảnh bìa kiểu cameo: hai đường viền chỉ mảnh quanh ảnh oval, một cành ô liu dài
 * ôm góc dưới bên trái và một cành ngắn ở góc trên bên phải. Nét tự vẽ ra sau khi mở thiệp.
 */
function CameoFrame({ className }: { className?: string }) {
  const opened =
    'group-data-[phase=opening]/inv:[stroke-dashoffset:0] group-data-[phase=open]/inv:[stroke-dashoffset:0]'
  const draw = (delay: string) =>
    cn(
      '[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[1800ms] ease-out',
      opened,
      delay,
    )
  const appear = cn(
    'opacity-0 transition-opacity duration-700 delay-[2800ms]',
    'group-data-[phase=opening]/inv:opacity-100 group-data-[phase=open]/inv:opacity-100',
  )

  const long = oliveBranch(178, 290, 99, 122)
  const short = oliveBranch(8, 62, 99, 122)

  return (
    <svg
      viewBox="0 0 200 250"
      aria-hidden
      className={cn('pointer-events-none overflow-visible', className)}
    >
      {/* Viền đôi: chỉ mảnh sát ảnh + viền ngoài nhạt hơn */}
      <g fill="none" stroke="var(--hc-leaf)">
        <ellipse
          cx="100"
          cy="125"
          rx="90"
          ry="112"
          strokeWidth="0.9"
          pathLength={1}
          className={draw('delay-[1400ms]')}
        />
        <ellipse
          cx="100"
          cy="125"
          rx="95"
          ry="118"
          strokeWidth="0.5"
          strokeOpacity="0.55"
          pathLength={1}
          className={draw('delay-[1600ms]')}
        />
      </g>
      {[long, short].map((branch, b) => (
        <g
          key={b}
          fill="none"
          stroke="var(--hc-leaf)"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={branch.stem} pathLength={1} className={draw('delay-[1900ms]')} />
          {branch.leaves.map((leaf, i) => (
            <path
              key={i}
              d={OLIVE_LEAF}
              pathLength={1}
              transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.rotate.toFixed(1)}) scale(${leaf.scale.toFixed(2)})`}
              className={cn(draw('delay-[2200ms]'), 'fill-(--hc-sage)/15')}
            />
          ))}
        </g>
      ))}
      {/* Vài quả ô liu nhỏ màu trầm ở đầu cành */}
      <g className={appear} fill="var(--hc-moss)">
        <circle cx={long.tip[0] + 3} cy={long.tip[1] - 2} r="1.7" />
        <circle cx={long.tip[0] - 1} cy={long.tip[1] - 5} r="1.3" />
        <circle cx={short.tip[0] + 2} cy={short.tip[1] + 3} r="1.5" />
      </g>
    </svg>
  )
}

/** Cành hoa dại: nét thân/lá tự vẽ ra khi phần tử cha (group/grow) có data-shown */
function Sprig({ className }: { className?: string }) {
  const draw =
    '[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[1800ms] ease-out group-data-shown/grow:[stroke-dashoffset:0]'
  const bloom =
    'origin-center scale-0 opacity-0 transition duration-700 [transform-box:fill-box] group-data-shown/grow:scale-100 group-data-shown/grow:opacity-100'

  return (
    <svg
      viewBox="0 0 80 160"
      aria-hidden
      className={cn('pointer-events-none overflow-visible', className)}
    >
      <g fill="none" stroke="var(--hc-leaf)" strokeWidth="1.3" strokeLinecap="round">
        <path
          pathLength={1}
          className={draw}
          d="M40 158 C 37 122, 47 92, 39 58 C 35 40, 40 24, 45 10"
        />
        <path pathLength={1} className={draw} d="M40 104 C 50 99, 57 90, 59 80" />
        <path pathLength={1} className={draw} d="M38 70 C 31 62, 27 52, 26 44" />
        <path
          pathLength={1}
          className={cn(draw, 'fill-(--hc-sage)/25')}
          d="M39 128 C 26 122, 19 110, 17 101 C 29 105, 36 114, 39 128 Z"
        />
        <path
          pathLength={1}
          className={cn(draw, 'fill-(--hc-sage)/25')}
          d="M41 94 C 52 90, 58 80, 61 72 C 51 75, 44 83, 41 94 Z"
        />
        <path
          pathLength={1}
          className={cn(draw, 'fill-(--hc-sage)/25')}
          d="M39 50 C 47 46, 52 38, 53 31 C 45 34, 40 41, 39 50 Z"
        />
      </g>
      <Flower cx={45} cy={9} petal="var(--hc-blush-deep)" className={cn(bloom, 'delay-[1200ms]')} />
      <Flower cx={60} cy={78} petal="var(--hc-lilac)" className={cn(bloom, 'delay-[1500ms]')} />
      <Flower cx={25} cy={42} petal="var(--hc-blush)" className={cn(bloom, 'delay-[1700ms]')} />
    </svg>
  )
}

function Flower({
  cx,
  cy,
  petal,
  className,
}: {
  cx: number
  cy: number
  petal: string
  className?: string
}) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <g className={className}>
      {petals.map((deg) => {
        const rad = (deg * Math.PI) / 180
        return (
          <circle
            key={deg}
            cx={cx + Math.sin(rad) * 4.2}
            cy={cy - Math.cos(rad) * 4.2}
            r={3.6}
            fill={petal}
          />
        )
      })}
      <circle cx={cx} cy={cy} r={2.4} fill="var(--hc-butter)" />
    </g>
  )
}
