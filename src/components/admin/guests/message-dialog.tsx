'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_INVITE_MESSAGE, INVITE_PLACEHOLDERS, inviteMessage } from '@/lib/guests'
import { errorMessage, type WeddingPatch } from '../editor-types'

/** Sửa tin nhắn mời mẫu (lưu vào nội dung thiệp, dùng chung cho mọi khách) */
export function MessageDialog({
  open,
  onOpenChange,
  template,
  sample,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: string
  sample: { name: string; link: string; groom: string; bride: string }
  onSave: (patch: WeddingPatch) => Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <MessageForm
            template={template}
            sample={sample}
            onSave={onSave}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function MessageForm({
  template,
  sample,
  onSave,
  onDone,
}: {
  template: string
  sample: { name: string; link: string; groom: string; bride: string }
  onSave: (patch: WeddingPatch) => Promise<void>
  onDone: () => void
}) {
  const [text, setText] = useState(template)
  const [pending, setPending] = useState(false)

  async function save() {
    setPending(true)
    try {
      const value = text.trim()
      await onSave({ inviteMessage: value && value !== DEFAULT_INVITE_MESSAGE ? value : null })
      toast.success('Đã lưu tin nhắn mẫu')
      onDone()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Tin nhắn mời mẫu</DialogTitle>
        <DialogDescription>
          Bấm &quot;Chép tin nhắn&quot; ở từng khách là có sẵn nội dung để dán vào Zalo/Messenger.
        </DialogDescription>
      </DialogHeader>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        maxLength={1000}
        aria-label="Nội dung tin nhắn mẫu"
      />
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {INVITE_PLACEHOLDERS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setText((t) => `${t}${p.key}`)}
            className="rounded hover:text-foreground"
          >
            <code className="font-mono text-foreground">{p.key}</code> {p.label}
          </button>
        ))}
      </p>
      <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-line">
        {inviteMessage(text, sample)}
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={() => setText(DEFAULT_INVITE_MESSAGE)}>
          Dùng mẫu mặc định
        </Button>
        <Button type="button" onClick={save} disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          Lưu
        </Button>
      </DialogFooter>
    </div>
  )
}
