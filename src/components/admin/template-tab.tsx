'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { TemplateId } from '@/lib/invitation/types'
import { TEMPLATE_CATALOG } from '@/templates/catalog'
import { errorMessage, type EditorFormProps } from './editor-types'
import { TemplatePicker } from './template-picker'

/** Đổi mẫu thiệp: bấm là lưu ngay, khách mở thiệp sẽ thấy mẫu mới */
export function TemplateTab({ wedding, onSave }: EditorFormProps) {
  const [pending, setPending] = useState(false)

  async function choose(templateId: TemplateId) {
    if (templateId === wedding.templateId || pending) return
    setPending(true)
    try {
      await onSave({ templateId })
      toast.success(`Đã đổi sang mẫu ${TEMPLATE_CATALOG[templateId].name}`)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid gap-4" aria-busy={pending}>
      <p className="text-sm text-muted-foreground">
        Chọn mẫu là đổi ngay cho mọi khách. Đổi lại lúc nào cũng được, nội dung giữ nguyên.
      </p>
      <TemplatePicker value={wedding.templateId} onChange={choose} />
    </div>
  )
}
