'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Report = (section: string, dirty: boolean) => void

const ReportContext = createContext<Report>(() => {})
const SectionContext = createContext('')

/**
 * Theo dõi tab nào có thay đổi chưa lưu: hiện chấm trên menu và hỏi lại trước khi đóng trang.
 * Các tab luôn được giữ trong trang (chỉ ẩn đi), nên đổi tab không làm mất nội dung đang sửa.
 */
export function useDirtyTracker() {
  const [dirty, setDirty] = useState<ReadonlySet<string>>(new Set())

  // Giữ nguyên tham chiếu để effect của các form không chạy lại mỗi lần render
  const report = useCallback<Report>(
    (section, isDirty) =>
      setDirty((prev) => {
        if (prev.has(section) === isDirty) return prev
        const next = new Set(prev)
        if (isDirty) next.add(section)
        else next.delete(section)
        return next
      }),
    [],
  )

  useEffect(() => {
    if (dirty.size === 0) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  return { dirty, report }
}

export function DirtyProvider({ report, children }: { report: Report; children: ReactNode }) {
  return <ReportContext value={report}>{children}</ReportContext>
}

/** Bọc nội dung một tab để các form bên trong báo đúng tên tab */
export function DirtySection({ name, children }: { name: string; children: ReactNode }) {
  return <SectionContext value={name}>{children}</SectionContext>
}

/** Form gọi hook này với trạng thái "có thay đổi chưa lưu" của mình */
export function useReportDirty(dirty: boolean, id: string) {
  const report = useContext(ReportContext)
  const section = useContext(SectionContext)
  const key = `${section}:${id}`
  useEffect(() => {
    report(key, dirty)
    return () => report(key, false)
  }, [report, key, dirty])
}

/** "info:form" → "info" */
export const sectionOf = (key: string) => key.split(':')[0]
