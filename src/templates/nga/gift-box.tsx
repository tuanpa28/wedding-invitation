'use client'

import { Gift } from 'lucide-react'
import { m } from 'motion/react'
import { useState, type ReactNode } from 'react'

/** "Hộp quà cưới": bấm để mở ra tài khoản mừng cưới */
export function GiftBox({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-(--ng-line) bg-[#f4efe7]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-col items-center gap-2 px-5 py-8 text-center outline-none focus-visible:ring-2 focus-visible:ring-(--ng-taupe)"
      >
        <m.span
          animate={open ? { rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] } : { rotate: 0 }}
          transition={{ duration: 0.6 }}
          className="grid size-16 place-items-center rounded-xl bg-(--ng-taupe) text-white shadow-[0_10px_24px_-14px_rgba(70,52,35,0.9)]"
        >
          <Gift className="size-8" aria-hidden />
        </m.span>
        <span className="mt-2 text-lg font-semibold tracking-[0.15em] uppercase">Hộp quà cưới</span>
        <span className="text-sm text-(--ng-taupe)">
          {open ? 'Chạm để đóng hộp quà' : 'Chạm để mở hộp quà'}
        </span>
      </button>
      {open && (
        <m.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="px-4 pb-6"
        >
          {children}
        </m.div>
      )}
    </div>
  )
}
