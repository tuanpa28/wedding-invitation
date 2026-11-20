import { ArrowDown } from 'lucide-react'
import { Cormorant_Garamond, Great_Vibes, Josefin_Sans } from 'next/font/google'
import type { CSSProperties, ReactNode } from 'react'
import { Album } from '@/components/invitation/album'
import { Countdown } from '@/components/invitation/countdown'
import { EventActions } from '@/components/invitation/event-actions'
import { GiftSection, hasGiftAccounts } from '@/components/invitation/feedback/gift-section'
import { RsvpForm } from '@/components/invitation/feedback/rsvp-form'
import { feedbackTheme } from '@/components/invitation/feedback/styles'
import { WishesBoard } from '@/components/invitation/feedback/wishes-board'
import { InvitationShell, OpenInvitationButton } from '@/components/invitation/invitation-shell'
import { FallingParticles, ParallaxImage } from '@/components/invitation/motion'
import { Reveal } from '@/components/invitation/reveal'
import { WeddingImage as Image } from '@/components/invitation/wedding-image'
import { rsvpState } from '@/lib/feedback'
import { eventDateParts, inviteeName, monthGrid, SIDE_LABEL } from '@/lib/invitation/helpers'
import type { Person, Photo, WeddingEvent } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'
import type { TemplateProps } from '../types'
import { GiftBox } from './gift-box'

// Ngà — trang nhã: nền ngà, thẻ trắng, cành lá mảnh ở góc, nâu taupe.
// Mở thiệp: con dấu sáp vàng tan đi, vạt phong bì lật lên, ảnh cưới trượt ra.
// Máy tính: hai cột, cột trái (giờ, nơi tổ chức, bản đồ) đứng yên khi cuộn.

const script = Great_Vibes({
  weight: '400',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-ng-script',
  display: 'swap',
  preload: false,
})

const serif = Cormorant_Garamond({
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-ng-serif',
  display: 'swap',
  preload: false,
})

const caps = Josefin_Sans({
  weight: ['400', '600'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-ng-caps',
  display: 'swap',
  preload: false,
})

const palette = {
  '--ng-bg': '#f6f2ec',
  '--ng-card': '#ffffff',
  '--ng-ink': '#1f1a17',
  // Nâu taupe: chữ lớn (giờ, nơi tổ chức) và nút
  '--ng-taupe': '#8a6f55',
  // Chữ phụ: đủ tương phản trên nền trắng
  '--ng-muted': '#6b5644',
  '--ng-line': '#e6dccd',
  '--ng-envelope': '#e2d5c1',
  '--ng-envelope-deep': '#d3c2a8',
  '--ng-night': '#0f0e0d',
} as CSSProperties

const feedback = feedbackTheme({
  accent: '#8a6f55',
  onAccent: '#ffffff',
  ink: '#1f1a17',
  muted: '#6b5644',
  card: '#faf7f2',
  line: '#e6dccd',
  radius: '0.5rem',
})

const capsLabel = 'font-(family-name:--font-ng-caps) text-[0.7rem] tracking-[0.28em] uppercase'

export default function NgaTemplate({
  invitation,
  guest,
  events,
  featured,
  couple,
  calendarCouple,
}: TemplateProps) {
  const others = events.filter((e) => e.id !== featured.id)
  const photos = invitation.gallery
  const bigPhoto = photos[0] ?? invitation.cover
  const filmPhotos = photos.slice(1, 3)
  const foreverPhoto = photos[3] ?? invitation.cover
  const albumPhotos = photos.slice(4)
  const groom = invitation.groom
  const bride = invitation.bride

  return (
    <InvitationShell
      musicUrl={invitation.musicUrl}
      openDuration={1700}
      style={palette}
      className={cn(
        script.variable,
        serif.variable,
        caps.variable,
        'min-h-svh bg-(--ng-bg) font-(family-name:--font-ng-serif) text-[1.05rem] text-(--ng-ink) antialiased',
      )}
      musicButtonClassName="bg-(--ng-taupe) text-white focus-visible:ring-(--ng-taupe)"
    >
      <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6 sm:py-8">
        {/* overflow-clip (không phải hidden) để cột trái sticky vẫn hoạt động */}
        <article className="relative overflow-clip rounded-2xl bg-(--ng-card) shadow-[0_24px_60px_-40px_rgba(70,52,35,0.45)]">
          <Sprig className="absolute -top-3 -left-2 w-20 opacity-80 sm:top-0 sm:left-0 sm:w-36 sm:opacity-100" />
          <Sprig className="absolute -top-3 -right-2 w-20 -scale-x-100 opacity-80 sm:top-0 sm:right-0 sm:w-36 sm:opacity-100" />

          <Gate invitation={invitation} guestName={inviteeName(guest)} couple={couple} />

          {/* Chưa mở thiệp thì nội dung ẩn hẳn: khách phải mở phong bì trước (như hai mẫu còn lại) */}
          <div className="grid gap-14 px-5 pb-16 group-data-[phase=closed]/inv:hidden sm:px-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-0">
            {/* ---------- Cột trái: lời mời, giờ, nơi tổ chức, bản đồ ---------- */}
            {/* Cao hơn màn hình thì cuộn bên trong, để phần dưới của cột vẫn xem được */}
            <aside className="md:sticky md:top-6 md:h-fit md:max-h-[calc(100svh-3rem)] md:[scrollbar-width:thin] md:overflow-y-auto md:overscroll-contain md:border-r md:border-(--ng-line) md:pt-6 md:pr-8">
              <Reveal className="text-center">
                <p className={cn(capsLabel, 'text-(--ng-muted)')}>Trân trọng kính mời</p>
                <p className="mt-3 text-2xl font-medium uppercase">{inviteeName(guest)}</p>
                <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-(--ng-muted) uppercase">
                  Đến dự buổi tiệc chung vui cùng gia đình chúng tôi vào lúc
                </p>
                <FeaturedEvent event={featured} />
                <EventActions
                  event={featured}
                  couple={calendarCouple}
                  className="mt-6 justify-center"
                  buttonClassName="rounded-full bg-(--ng-taupe) px-4 text-white hover:opacity-90 focus-visible:ring-(--ng-taupe)"
                />
              </Reveal>
            </aside>

            {/* ---------- Cột phải: ảnh, gia đình, dải phim, lịch, quà, RSVP ---------- */}
            <div className="space-y-14 md:pt-6 md:pl-8">
              <Reveal variant="zoom">
                <ParallaxImage className="aspect-[4/5] w-full rounded-sm" strength={24}>
                  <Image
                    src={bigPhoto.src}
                    alt={bigPhoto.alt}
                    fill
                    sizes="(min-width: 768px) 480px, 92vw"
                    className="object-cover"
                  />
                </ParallaxImage>
              </Reveal>

              {invitation.quote && (
                <Reveal variant="blur">
                  <p className="mx-auto max-w-sm text-center text-base leading-loose text-(--ng-muted) italic">
                    {invitation.quote}
                  </p>
                </Reveal>
              )}

              <Reveal className="grid grid-cols-2 gap-4" stagger={0.15}>
                <Portrait
                  person={groom}
                  photo={groom.photo ?? photos[1]}
                  label={SIDE_LABEL.groom}
                />
                <Portrait
                  person={bride}
                  photo={bride.photo ?? photos[2]}
                  label={SIDE_LABEL.bride}
                />
              </Reveal>

              <Reveal>
                <p className="flex justify-between font-(family-name:--font-ng-caps) text-lg tracking-[0.25em] uppercase sm:text-xl">
                  <span>Welcome</span>
                  <span>to</span>
                  <span>Wedding</span>
                </p>
              </Reveal>

              <FilmStrip photos={filmPhotos} target={featured.startAt} />

              <Reveal variant="zoom" className="relative pl-8">
                <p
                  aria-hidden
                  className="absolute top-1/2 left-0 origin-center -translate-x-[42%] -translate-y-1/2 -rotate-90 font-(family-name:--font-ng-caps) text-xs tracking-[0.4em] whitespace-nowrap text-(--ng-taupe) uppercase"
                >
                  My love · Forever
                </p>
                <ParallaxImage className="aspect-[3/4] w-full rounded-sm" strength={28}>
                  <Image
                    src={foreverPhoto.src}
                    alt={foreverPhoto.alt}
                    fill
                    sizes="(min-width: 768px) 440px, 84vw"
                    className="object-cover"
                  />
                </ParallaxImage>
              </Reveal>

              <HeartCalendar event={featured} />

              {others.length > 0 && (
                <Reveal>
                  <SectionTitle>Các nghi lễ khác</SectionTitle>
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                    {others.map((e) => (
                      <OtherEvent key={e.id} event={e} calendarCouple={calendarCouple} />
                    ))}
                  </ul>
                </Reveal>
              )}

              {albumPhotos.length > 0 && (
                <section>
                  <SectionTitle>Khoảnh khắc</SectionTitle>
                  <Album
                    photos={albumPhotos}
                    className="mt-6 gap-2"
                    itemClassName="overflow-hidden rounded-sm"
                  />
                </section>
              )}

              <div className="space-y-10" style={feedback}>
                {hasGiftAccounts(invitation) && (
                  <Reveal>
                    <GiftBox>
                      <GiftSection invitation={invitation} guest={guest} />
                    </GiftBox>
                  </Reveal>
                )}

                {rsvpState(invitation) !== 'disabled' && (
                  <Reveal className="rounded-xl border border-(--ng-line) bg-white p-5 shadow-[0_10px_30px_-24px_rgba(70,52,35,0.5)] sm:p-7">
                    <SectionTitle>Xác nhận tham dự</SectionTitle>
                    <div className="mt-6">
                      <RsvpForm invitation={invitation} guest={guest} />
                    </div>
                  </Reveal>
                )}

                {invitation.wishesEnabled !== false && (
                  <section>
                    <SectionTitle>Lời chúc từ mọi người</SectionTitle>
                    {/* Danh sách lời chúc cuộn trong khung như sổ lưu bút */}
                    <div className="mt-6 [&_ul]:max-h-[26rem] [&_ul]:overflow-y-auto [&_ul]:overscroll-contain [&_ul]:pr-1">
                      <WishesBoard guest={guest} />
                    </div>
                  </section>
                )}
              </div>

              <Reveal className="pt-4 text-center">
                <p className="font-(family-name:--font-ng-script) text-6xl text-(--ng-ink)">
                  Thank you
                </p>
                <p className="mt-4 text-(--ng-muted)">
                  {couple[0].shortName} &amp; {couple[1].shortName}
                </p>
                <p className="text-sm text-(--ng-muted)">
                  {eventDateParts(featured.startAt).date.replaceAll('.', '/')}
                </p>
              </Reveal>
            </div>
          </div>
        </article>
        <p
          className={cn(
            capsLabel,
            'py-6 text-center text-(--ng-muted) group-data-[phase=closed]/inv:hidden',
          )}
        >
          Thiệp Hồng
        </p>
      </div>

      <FallingParticles shapes={['petal']} colors={['#f1c9cf', '#ead5cc', '#e6b8c0']} count={12} />
    </InvitationShell>
  )
}

/* ------------------------------------------------------------------ */
/* Phần mở đầu: dòng chữ + phong bì                                    */
/* ------------------------------------------------------------------ */

function Gate({
  invitation,
  guestName,
  couple,
}: {
  invitation: TemplateProps['invitation']
  guestName: string
  couple: [Person, Person]
}) {
  const initials = `${lastInitial(couple[0].shortName)}${lastInitial(couple[1].shortName)}`
  return (
    <section className="relative flex flex-col px-5 pt-10 pb-10 text-center group-data-[phase=closed]/inv:min-h-[calc(100svh-1.5rem)] group-data-[phase=closed]/inv:justify-center sm:pt-12 sm:group-data-[phase=closed]/inv:min-h-[calc(100svh-4rem)]">
      <p
        className={cn(
          capsLabel,
          'grid grid-cols-3 text-[0.6rem] tracking-[0.18em] whitespace-nowrap text-(--ng-ink) sm:text-[0.7rem] sm:tracking-[0.28em]',
        )}
      >
        <span>You are</span>
        <span>The love of</span>
        <span>My life</span>
      </p>
      <h1 className="th-shimmer mt-3 bg-[linear-gradient(110deg,var(--ng-ink)_42%,#c9ae86_50%,var(--ng-ink)_58%)] bg-size-[260%_100%] bg-clip-text pb-2 font-(family-name:--font-ng-script) text-[2.6rem] leading-tight whitespace-nowrap text-transparent sm:text-6xl">
        Wedding Invitation
      </h1>
      <p className={cn(capsLabel, 'mt-2 text-(--ng-muted)')}>
        {couple[0].shortName} &amp; {couple[1].shortName}
      </p>

      {/* Chừa chỗ phía trên cho ảnh trượt ra khỏi phong bì */}
      <div className="relative mx-auto mt-44 aspect-[3/2] w-[min(82vw,380px)] [perspective:1000px] sm:mt-52">
        <p className="absolute inset-x-0 -top-10 text-sm text-(--ng-muted) transition-opacity duration-300 group-data-[phase=open]/inv:opacity-0 group-data-[phase=opening]/inv:opacity-0">
          Chạm để mở thiệp · <span className="text-(--ng-ink)">{guestName}</span>
        </p>

        {/* Mặt sau phong bì */}
        <div className="absolute inset-0 rounded-sm bg-(--ng-envelope-deep) shadow-[0_22px_40px_-24px_rgba(70,52,35,0.7)]" />

        {/* Ảnh cưới: trượt lên khỏi phong bì sau khi vạt lật */}
        <div className="absolute inset-x-[6%] bottom-[6%] z-10 h-[94%] overflow-hidden rounded-[2px] bg-white p-1.5 shadow-[0_8px_24px_-12px_rgba(40,30,20,0.45)] transition-transform delay-[550ms] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[phase=open]/inv:-translate-y-[72%] group-data-[phase=opening]/inv:-translate-y-[72%] motion-reduce:transition-none">
          <div className="relative size-full">
            <Image
              src={invitation.cover.src}
              alt={invitation.cover.alt}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="380px"
              className="object-cover"
            />
          </div>
        </div>

        {/* Vạt trái, phải, dưới (màu đặc che ảnh bên trong) */}
        <div className="absolute inset-0 z-20 rounded-sm bg-[linear-gradient(135deg,#e9dfcf,#dccdb6)] [clip-path:polygon(0_0,52%_52%,0_100%)]" />
        <div className="absolute inset-0 z-20 rounded-sm bg-[linear-gradient(225deg,#e9dfcf,#dccdb6)] [clip-path:polygon(100%_0,48%_52%,100%_100%)]" />
        <div className="absolute inset-0 z-20 rounded-sm bg-[linear-gradient(0deg,#dccdb6,#e7dccb)] [clip-path:polygon(0_100%,50%_46%,100%_100%)]" />

        {/* Vạt trên: lật lên rồi lùi ra sau ảnh */}
        <div className="absolute inset-x-0 top-0 z-30 h-[56%] origin-top bg-[linear-gradient(180deg,#d9c9b0,#e6dac8)] transition-[transform,z-index] duration-700 ease-out [clip-path:polygon(0_0,100%_0,50%_100%)] group-data-[phase=open]/inv:z-0 group-data-[phase=open]/inv:[transform:rotateX(180deg)] group-data-[phase=opening]/inv:z-0 group-data-[phase=opening]/inv:[transform:rotateX(180deg)] motion-reduce:transition-none" />

        {/* Con dấu sáp vàng */}
        <OpenInvitationButton className="absolute top-[56%] left-1/2 z-40 grid size-[4.75rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#f1d08a,#c48a34_55%,#8c5a1c)] font-(family-name:--font-ng-script) text-3xl text-[#5a3810] shadow-[inset_0_-3px_6px_rgba(0,0,0,0.25),inset_0_3px_6px_rgba(255,240,200,0.45),0_6px_14px_-6px_rgba(60,35,10,0.7)] transition duration-500 group-data-[phase=open]/inv:scale-50 group-data-[phase=open]/inv:opacity-0 group-data-[phase=opening]/inv:scale-50 group-data-[phase=opening]/inv:opacity-0 hover:scale-105 focus-visible:ring-2 focus-visible:ring-(--ng-taupe) focus-visible:ring-offset-4 focus-visible:outline-none motion-reduce:transition-none">
          <span aria-hidden className="absolute inset-2 rounded-full border border-[#7a4c16]/40" />
          <span aria-hidden>{initials}</span>
          <span className="sr-only">Mở thiệp</span>
        </OpenInvitationButton>
      </div>

      <ArrowDown
        aria-hidden
        className="mx-auto mt-10 size-5 text-(--ng-muted) opacity-0 transition-opacity delay-[1400ms] duration-500 group-data-[phase=open]/inv:animate-bounce group-data-[phase=open]/inv:opacity-100"
      />
    </section>
  )
}

function lastInitial(name: string) {
  return name.trim().split(/\s+/).at(-1)?.charAt(0).toUpperCase() ?? ''
}

/* ------------------------------------------------------------------ */
/* Sự kiện                                                            */
/* ------------------------------------------------------------------ */

function FeaturedEvent({ event }: { event: WeddingEvent }) {
  const d = eventDateParts(event.startAt)
  return (
    <div className="mt-5">
      <p className="text-3xl font-medium text-(--ng-taupe) uppercase">
        {d.time.replace(':', ' giờ ')} | {d.weekday}
      </p>
      <p className="mt-1 text-3xl font-medium text-(--ng-taupe)">{d.date.replaceAll('.', '/')}</p>
      {event.lunarText && <p className="mt-1 text-sm text-(--ng-muted)">({event.lunarText})</p>}
      <Ornament className="mx-auto my-6 w-40" />
      <p className={cn(capsLabel, 'text-(--ng-muted)')}>{event.title} được cử hành tại</p>
      <p className="mt-3 text-3xl leading-tight font-medium text-(--ng-taupe) uppercase">
        {event.venue}
      </p>
      <p className="mt-2 text-sm text-(--ng-muted)">{event.address}</p>
      <MapCard event={event} />
    </div>
  )
}

/** Bản đồ nhúng (không cần API key) + nút mở Google Maps */
function MapCard({ event }: { event: WeddingEvent }) {
  const query = encodeURIComponent(`${event.venue}, ${event.address}`)
  return (
    <div className="relative mt-6 overflow-hidden rounded-xl border border-(--ng-line) shadow-[0_10px_30px_-22px_rgba(70,52,35,0.6)]">
      <iframe
        title={`Bản đồ ${event.venue}`}
        src={`https://maps.google.com/maps?q=${query}&z=15&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-56 w-full border-0 grayscale-[30%]"
      />
    </div>
  )
}

function OtherEvent({
  event,
  calendarCouple,
}: {
  event: WeddingEvent
  calendarCouple: TemplateProps['calendarCouple']
}) {
  const d = eventDateParts(event.startAt)
  return (
    <li className="rounded-xl border border-(--ng-line) bg-[#faf7f2] px-4 py-4 text-center">
      <p className="text-lg font-semibold">{event.title}</p>
      <p className="text-(--ng-taupe)">
        {d.time} · {d.weekday}, {d.date.replaceAll('.', '/')}
      </p>
      <p className="mt-1 text-sm">{event.venue}</p>
      <p className="text-sm text-(--ng-muted)">{event.address}</p>
      <EventActions
        event={event}
        couple={calendarCouple}
        className="mt-3 justify-center gap-x-4"
        buttonClassName="min-h-9 px-0 text-xs font-semibold text-(--ng-taupe) underline-offset-4 hover:underline focus-visible:ring-(--ng-taupe)"
      />
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Ảnh, dải phim, lịch                                                 */
/* ------------------------------------------------------------------ */

function Portrait({ person, photo, label }: { person: Person; photo?: Photo; label: string }) {
  return (
    <figure className="text-center">
      {photo && (
        <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width: 768px) 220px, 44vw"
            className="object-cover"
          />
        </div>
      )}
      <span aria-hidden className="mx-auto mt-3 block h-6 w-px bg-(--ng-ink)/60" />
      <figcaption>
        <p className={cn(capsLabel, 'mt-2 text-(--ng-muted)')}>{label}</p>
        <p className="mt-1 text-xl">{person.shortName}</p>
        {(person.father || person.mother) && (
          <p className="mt-1 text-xs leading-relaxed text-(--ng-muted)">
            {person.father}
            {person.father && person.mother && <br />}
            {person.mother}
          </p>
        )}
      </figcaption>
    </figure>
  )
}

/** Khối đen như cuộn phim: ảnh + đếm ngược */
function FilmStrip({ photos, target }: { photos: Photo[]; target: string }) {
  const holes =
    'h-3 bg-[repeating-linear-gradient(90deg,transparent_0_10px,rgba(255,255,255,0.75)_10px_18px,transparent_18px_28px)] bg-size-[28px_8px] bg-center bg-repeat-x'
  return (
    <Reveal variant="zoom" className="relative bg-(--ng-night) px-7 py-4 text-white">
      <div aria-hidden className={holes} />
      <p
        aria-hidden
        className="absolute top-1/2 left-1 -translate-y-1/2 rotate-180 font-(family-name:--font-ng-caps) text-[0.55rem] tracking-[0.4em] text-white/60 uppercase [writing-mode:vertical-rl]"
      >
        Love story
      </p>
      <p
        aria-hidden
        className="absolute top-1/2 right-1 -translate-y-1/2 font-(family-name:--font-ng-caps) text-[0.55rem] tracking-[0.4em] text-white/60 uppercase [writing-mode:vertical-rl]"
      >
        Our wedding
      </p>
      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {photos.map((p) => (
            <div key={p.src} className="relative aspect-[4/3] overflow-hidden rounded-[3px]">
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(min-width: 768px) 220px, 42vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
      <Countdown
        target={target}
        className="mt-6 mb-2"
        numberClassName="font-(family-name:--font-ng-serif) text-3xl"
        labelClassName="mt-1 font-(family-name:--font-ng-caps) text-[0.6rem] tracking-[0.25em] text-white/70 uppercase"
      />
      <div aria-hidden className={cn(holes, 'mt-3')} />
    </Reveal>
  )
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/** Lịch tháng cưới nền đen, ngày cưới nằm trong trái tim */
function HeartCalendar({ event }: { event: WeddingEvent }) {
  const d = eventDateParts(event.startAt)
  const weddingDay = Number(d.day)
  return (
    <Reveal variant="zoom" className="bg-(--ng-night) px-5 py-8 text-center text-white">
      <p className="text-xl italic">
        {d.weekday}, {d.date.replaceAll('.', '/')} | {d.time}
      </p>
      {event.lunarText && <p className="mt-1 text-sm text-white/65 italic">{event.lunarText}</p>}
      <table
        className="mx-auto mt-6 w-full max-w-sm table-fixed text-sm"
        aria-label={`Lịch ${d.monthLabel}`}
      >
        <thead>
          <tr>
            {WEEKDAYS.map((w) => (
              <th
                key={w}
                scope="col"
                className="pb-3 font-(family-name:--font-ng-caps) text-[0.65rem] font-normal tracking-widest text-white/60"
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthGrid(event.startAt).map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => (
                <td key={di} className="py-1.5">
                  {day === weddingDay ? (
                    <span className="relative inline-grid size-9 place-items-center font-semibold text-(--ng-night)">
                      <svg
                        viewBox="0 0 32 29"
                        aria-hidden
                        className="th-heartbeat absolute inset-0 size-full"
                      >
                        <path
                          d="M16 28.5 3.1 15.9A8 8 0 0 1 16 5.4a8 8 0 0 1 12.9 10.5Z"
                          fill="#e2d1b6"
                        />
                      </svg>
                      <span className="relative">{day}</span>
                      <span className="sr-only"> (ngày cưới)</span>
                    </span>
                  ) : (
                    <span className={cn(day === null && 'invisible')}>{day ?? '·'}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Reveal>
  )
}

/* ------------------------------------------------------------------ */
/* Trang trí                                                           */
/* ------------------------------------------------------------------ */

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-center font-(family-name:--font-ng-caps) text-sm font-semibold tracking-[0.25em] text-(--ng-ink) uppercase">
      {children}
    </h2>
  )
}

function Ornament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 10" aria-hidden className={className}>
      <line x1="0" y1="5" x2="62" y2="5" stroke="#c9b79c" strokeWidth="0.8" />
      {[70, 76, 82, 88].map((x) => (
        <rect
          key={x}
          x={x}
          y="2.5"
          width="5"
          height="5"
          rx="1"
          fill="none"
          stroke="#b39a7a"
          strokeWidth="0.8"
        />
      ))}
      <line x1="98" y1="5" x2="160" y2="5" stroke="#c9b79c" strokeWidth="0.8" />
    </svg>
  )
}

/** Cành lá mảnh vẽ nét, đặt ở góc thẻ */
function Sprig({ className }: { className?: string }) {
  const leaves = [
    [18, 22, -35],
    [30, 40, -20],
    [44, 30, 40],
    [40, 58, -10],
    [60, 50, 30],
    [56, 76, 0],
    [76, 70, 25],
  ]
  return (
    <svg viewBox="0 0 120 120" aria-hidden className={cn('pointer-events-none', className)}>
      <path d="M2 2 C 30 30, 50 60, 70 110" fill="none" stroke="#c9b79c" strokeWidth="1" />
      {leaves.map(([x, y, r], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="7"
          ry="3.2"
          transform={`rotate(${r} ${x} ${y})`}
          fill="none"
          stroke="#c4ae8f"
          strokeWidth="0.9"
        />
      ))}
      <circle cx="12" cy="48" r="1.6" fill="#d8c3a5" />
      <circle cx="84" cy="96" r="1.6" fill="#d8c3a5" />
    </svg>
  )
}
