// Class dùng chung cho form RSVP / sổ lưu bút. Màu đến từ biến CSS --fb-* (template đặt qua feedbackTheme).

export const fieldClass =
  'w-full rounded-(--fb-radius) border border-(--fb-line) bg-(--fb-card) px-3 py-2.5 text-base text-(--fb-ink) outline-none placeholder:text-(--fb-muted) focus:border-(--fb-accent) focus:ring-1 focus:ring-(--fb-accent) aria-invalid:border-(--fb-error)'

export const primaryButtonClass =
  'min-h-12 rounded-(--fb-radius) bg-(--fb-accent) px-6 text-sm font-semibold tracking-wide text-(--fb-on-accent) transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-(--fb-accent) focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60'

/** Bảng màu của form theo template */
export interface FeedbackTheme {
  accent: string
  onAccent: string
  ink: string
  muted: string
  card: string
  line: string
  error?: string
  radius?: string
}

export function feedbackTheme(theme: FeedbackTheme): React.CSSProperties {
  return {
    '--fb-accent': theme.accent,
    '--fb-on-accent': theme.onAccent,
    '--fb-ink': theme.ink,
    '--fb-muted': theme.muted,
    '--fb-card': theme.card,
    '--fb-line': theme.line,
    '--fb-error': theme.error ?? '#b42318',
    '--fb-radius': theme.radius ?? '0.75rem',
  } as React.CSSProperties
}
