import Link from 'next/link'

/** Wordmark "Thiệp Hồng": chữ nghiêng + dấu triện son nhỏ */
export function Wordmark({ href = '/dashboard' }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 rounded-md outline-offset-4">
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-[6px] bg-primary text-[13px] leading-none text-primary-foreground shadow-[inset_0_0_0_2px_rgb(255_255_255/0.25)]"
      >
        囍
      </span>
      <span className="font-display text-xl tracking-tight italic">Thiệp Hồng</span>
    </Link>
  )
}
