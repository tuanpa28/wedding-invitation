'use client'

import type { User } from 'firebase/auth'
import { Loader2, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  checkIsAdmin,
  loadWedding,
  onAdminAuthChange,
  signInForEmulatorTest,
  signInWithGoogle,
  signOutAdmin,
} from '@/lib/firebase/admin-client'
import { USE_EMULATOR } from '@/lib/firebase/config'
import type { WeddingDoc } from '@/lib/invitation/types'
import type { PrerenderStamp } from '@/lib/prerender'
import { WeddingEditor } from './wedding-editor'
import { Wordmark } from './wordmark'

type State =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'forbidden'; user: User }
  | { status: 'error'; user: User }
  | { status: 'ready'; user: User; wedding: WeddingDoc | null }

/** Trang quản lý: đăng nhập Google → kiểm tra email trong danh sách admin → trình sửa thiệp */
export function AdminApp({ built }: { built: PrerenderStamp | null }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  // Emulator: cho test tự động đăng nhập mà không cần popup Google
  useEffect(() => {
    if (USE_EMULATOR) {
      Object.assign(window, { __thiephongTestSignIn: signInForEmulatorTest })
    }
  }, [])

  useEffect(
    () =>
      onAdminAuthChange(async (user) => {
        if (!user) return setState({ status: 'signed-out' })
        setState({ status: 'loading' })
        try {
          if (!(await checkIsAdmin())) return setState({ status: 'forbidden', user })
          setState({ status: 'ready', user, wedding: await loadWedding() })
        } catch {
          setState({ status: 'error', user })
        }
      }),
    [],
  )

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Wordmark href="/admin" />
          <span className="flex-1" />
          {'user' in state && <UserBadge user={state.user} />}
        </div>
      </header>
      <main>
        {state.status === 'loading' && (
          <div className="grid min-h-[60svh] place-items-center" aria-busy="true">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {state.status === 'signed-out' && <SignIn />}
        {state.status === 'forbidden' && (
          <Notice title="Tài khoản không có quyền quản lý">
            Email <strong>{state.user.email}</strong> chưa nằm trong danh sách quản trị. Đăng nhập
            bằng tài khoản khác, hoặc nhờ người quản trị thêm email này (README → Danh sách admin).
          </Notice>
        )}
        {state.status === 'error' && (
          <Notice title="Chưa tải được dữ liệu">Kiểm tra kết nối mạng rồi tải lại trang.</Notice>
        )}
        {state.status === 'ready' && <WeddingEditor initial={state.wedding} built={built} />}
      </main>
    </>
  )
}

function SignIn() {
  const [pending, setPending] = useState(false)

  async function signIn() {
    setPending(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        console.error('Đăng nhập Google lỗi:', error)
        toast.error('Không đăng nhập được, thử lại sau')
      }
      setPending(false)
    }
  }

  return (
    <section className="mx-auto flex max-w-sm flex-col items-center px-4 py-20 text-center">
      <p aria-hidden className="font-display text-7xl text-primary/80">
        囍
      </p>
      <h1 className="mt-6 font-display text-3xl tracking-tight">Quản lý thiệp cưới</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Đăng nhập bằng tài khoản Google có trong danh sách quản trị. Khách mời không cần đăng nhập.
      </p>
      <Button className="mt-8 h-11 w-full text-[15px]" onClick={signIn} disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Đăng nhập với Google
      </Button>
      {USE_EMULATOR && (
        <p className="mt-4 text-xs text-muted-foreground">
          Đang chạy emulator: chọn &quot;Add new account&quot; và nhập{' '}
          <code className="font-mono">admin@thiephong.test</code>.
        </p>
      )}
    </section>
  )
}

function UserBadge({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-right text-xs text-muted-foreground sm:block">{user.email}</span>
      <Button variant="ghost" size="icon" onClick={() => signOutAdmin()} title="Đăng xuất">
        <LogOut />
        <span className="sr-only">Đăng xuất</span>
      </Button>
    </div>
  )
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="font-display text-3xl tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{children}</p>
      <Button variant="outline" className="mt-6" onClick={() => signOutAdmin()}>
        Đăng xuất
      </Button>
    </section>
  )
}
