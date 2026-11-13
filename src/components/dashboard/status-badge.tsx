import { cn } from 'cn'

const LABEL = { draft: 'Bản nháp', published: 'Đã gửi', locked: 'Đã khoá' } as const

export function StatusBadge({
  status,
  className,
}: {
  status: keyof typeof LABEL
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        status === 'published' && 'bg-gold-soft text-gold',
        status === 'draft' && 'bg-muted text-muted-foreground',
        status === 'locked' && 'bg-destructive/10 text-destructive',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          status === 'published' ? 'bg-gold' : 'bg-current opacity-60',
        )}
      />
      {LABEL[status]}
    </span>
  )
}
