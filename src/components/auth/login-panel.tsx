'use client'

import { FlaskConical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'

export function LoginPanel({
  next,
  google,
  devLogin,
}: {
  next: string
  google: boolean
  devLogin: boolean
}) {
  const [pending, setPending] = useState(false)

  async function signInWithGoogle() {
    setPending(true)
    const { error } = await authClient.signIn.social({ provider: 'google', callbackURL: next })
    if (error) {
      toast.error(error.message ?? 'Không đăng nhập được bằng Google')
      setPending(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-3xl tracking-tight">Đăng nhập</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Dùng tài khoản Google để tạo và quản lý thiệp cưới. Khách mời không cần đăng nhập.
      </p>

      <Button
        className="mt-8 h-11 w-full gap-3 text-[15px]"
        variant="outline"
        onClick={signInWithGoogle}
        disabled={!google || pending}
      >
        <GoogleIcon />
        Tiếp tục với Google
      </Button>
      {!google && (
        <p className="mt-2 text-xs text-muted-foreground">
          Chưa cấu hình Google OAuth (GOOGLE_CLIENT_ID trong .env.local) — xem README.
        </p>
      )}

      {devLogin && <DevLoginForm next={next} />}
    </div>
  )
}

/** Đăng nhập thử bằng email + mật khẩu: chỉ hiện khi DEV_LOGIN=true và DB ở máy local */
function DevLoginForm({ next }: { next: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email')).trim().toLowerCase()
    const password = String(form.get('password'))
    setPending(true)

    // Thử đăng nhập; chưa có tài khoản thì tạo luôn
    let { error } = await authClient.signIn.email({ email, password })
    if (error?.status === 401) {
      const name = email.split('@')[0]
      ;({ error } = await authClient.signUp.email({ email, password, name }))
    }
    if (error) {
      toast.error(error.message ?? 'Không đăng nhập được')
      setPending(false)
      return
    }
    router.replace(next)
    router.refresh()
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-10 rounded-xl border border-dashed bg-card p-4"
      aria-labelledby="dev-login-title"
    >
      <p id="dev-login-title" className="flex items-center gap-2 text-sm font-medium">
        <FlaskConical className="size-4 text-primary" />
        Tài khoản thử (chỉ máy local)
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Email chưa có sẽ được tạo mới. Mật khẩu tối thiểu 8 ký tự.
      </p>
      <div className="mt-4 grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="dev-email">Email</Label>
          <Input id="dev-email" name="email" type="email" required autoComplete="username" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="dev-password">Mật khẩu</Label>
          <Input
            id="dev-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" disabled={pending}>
          Vào bằng tài khoản thử
        </Button>
      </div>
    </form>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  )
}
