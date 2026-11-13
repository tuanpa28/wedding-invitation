'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

export function UserMenu({
  name,
  email,
  image,
}: {
  name: string
  email: string
  image: string | null
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    await authClient.signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden text-right text-xs leading-tight sm:block">
        <p className="font-medium">{name}</p>
        <p className="text-muted-foreground">{email}</p>
      </div>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh đại diện Google, nhỏ, không cần tối ưu
        <img src={image} alt="" className="size-8 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-full bg-accent text-sm font-medium text-accent-foreground"
        >
          {name.trim().at(0)?.toUpperCase() ?? '?'}
        </span>
      )}
      <Button variant="ghost" size="icon" onClick={signOut} disabled={pending} title="Đăng xuất">
        <LogOut />
        <span className="sr-only">Đăng xuất</span>
      </Button>
    </div>
  )
}
