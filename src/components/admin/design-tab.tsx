'use client'

import type { EditorFormProps } from './editor-types'
import { SectionTitle } from './field'
import { MediaForm } from './media-form'
import { TemplateTab } from './template-tab'

/** Giao diện thiệp: mẫu, ảnh bìa, album, nhạc nền. Mọi thay đổi ở đây được lưu ngay. */
export function DesignTab(props: EditorFormProps) {
  return (
    <div className="flex flex-col gap-10 pb-10">
      <p className="-mb-4 text-sm text-muted-foreground">
        Mọi thay đổi trong mục này được lưu ngay khi bạn chọn, không cần bấm lưu.
      </p>
      <section className="grid gap-4">
        <SectionTitle>Mẫu thiệp</SectionTitle>
        <TemplateTab {...props} />
      </section>
      <MediaForm {...props} />
    </div>
  )
}
