import { Suspense, type ReactNode } from 'react'
import { getSessionUser } from '@/server/session'
import { UserMenu } from './user-menu'
import { Wordmark } from './wordmark'

/** Thanh trên cùng của dashboard. Phần người dùng đọc session → nằm trong Suspense. */
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Wordmark />
        <div className="min-w-0 flex-1">{children}</div>
        <Suspense fallback={<div className="size-8 rounded-full bg-muted" />}>
          <HeaderUser />
        </Suspense>
      </div>
    </header>
  )
}

async function HeaderUser() {
  const user = await getSessionUser()
  if (!user) return null
  return <UserMenu name={user.name} email={user.email} image={user.image} />
}
