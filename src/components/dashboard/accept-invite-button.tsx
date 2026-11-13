'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { api, ApiError } from '@/lib/api-client'

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function accept() {
    setPending(true)
    try {
      const { weddingId } = await api<{ weddingId: string }>(
        `/api/invites/${encodeURIComponent(token)}/accept`,
        { method: 'POST' },
      )
      router.push(`/dashboard/${weddingId}`)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không nhận được lời mời')
      setPending(false)
    }
  }

  return (
    <Button size="lg" onClick={accept} disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      Nhận lời mời
    </Button>
  )
}
