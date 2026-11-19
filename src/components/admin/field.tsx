'use client'

import { cn } from 'cn'
import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

/** Nhãn + ô nhập + lỗi/gợi ý. `error` lấy từ map lỗi theo đường dẫn field. */
export function Field({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('grid content-start gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/** Gom lỗi zod thành { 'groom.fullName': 'Nhập họ tên' } */
export function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path.map(String).join('.')
    errors[key] ??= issue.message
  }
  return errors
}

/** Tiêu đề nhóm trong một tab */
export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b pb-2">
      <h3 className="font-display text-xl tracking-tight">{children}</h3>
      {aside}
    </div>
  )
}
