'use client'

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Music, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { WeddingImage } from '@/components/invitation/wedding-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isCloudinaryConfigured, uploadToCloudinary } from '@/lib/cloudinary'
import { DEFAULT_COVER, LIMITS } from '@/lib/invitation/defaults'
import type { Photo } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'
import { musicSchema } from '@/lib/validators/wedding'
import { errorMessage, type EditorFormProps } from './editor-types'
import { Field, SectionTitle } from './field'

type Props = EditorFormProps & { uploadsEnabled: boolean }

/** Ảnh bìa, album và nhạc nền. Mỗi thay đổi được lưu ngay. */
export function MediaForm({ wedding, onSave }: EditorFormProps) {
  const uploadsEnabled = isCloudinaryConfigured
  return (
    <div className="flex flex-col gap-10">
      {!uploadsEnabled && (
        <p className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
          Chưa cấu hình Cloudinary nên chưa tải ảnh/nhạc lên được. Thiệp đang dùng ảnh bìa mẫu (chỉ
          để xem thử). Thêm{' '}
          <code className="font-mono text-foreground">NEXT_PUBLIC_CLOUDINARY_*</code> vào{' '}
          <code className="font-mono text-foreground">.env</code> theo README rồi build lại.
        </p>
      )}
      <CoverSection wedding={wedding} uploadsEnabled={uploadsEnabled} onSave={onSave} />
      <GallerySection wedding={wedding} uploadsEnabled={uploadsEnabled} onSave={onSave} />
      <MusicSection wedding={wedding} uploadsEnabled={uploadsEnabled} onSave={onSave} />
    </div>
  )
}

/** Đọc kích thước ảnh khi Cloudinary không trả về (hiếm) */
function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = reject
    img.src = url
  })
}

async function uploadPhoto(file: File, alt: string): Promise<Photo> {
  const uploaded = await uploadToCloudinary(file, 'image')
  const size =
    uploaded.width && uploaded.height
      ? { width: uploaded.width, height: uploaded.height }
      : await imageSize(file)
  return { src: uploaded.url, ...size, alt, publicId: uploaded.publicId }
}

function CoverSection({ wedding, uploadsEnabled, onSave }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const cover = wedding.cover ?? DEFAULT_COVER

  async function save(next: Photo | null) {
    await onSave({ cover: next })
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPending(true)
    try {
      const { src, width, height, alt } = await uploadPhoto(file, 'Ảnh bìa')
      const photo = { src, width, height, alt }
      await save(photo)
      toast.success('Đã đổi ảnh bìa')
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được ảnh bìa'))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="grid gap-4">
      <SectionTitle>Ảnh bìa</SectionTitle>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative aspect-[2/3] w-40 overflow-hidden rounded-lg border bg-muted">
          <WeddingImage
            src={cover.src}
            alt={cover.alt}
            fill
            sizes="160px"
            className="object-cover"
          />
          {!wedding.cover && (
            <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-center text-[11px] text-white">
              Ảnh mẫu — cần thay
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={input} type="file" accept="image/*" hidden onChange={onFile} />
          <Button
            type="button"
            onClick={() => input.current?.click()}
            disabled={!uploadsEnabled || pending}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Upload />}
            {wedding.cover ? 'Đổi ảnh bìa' : 'Tải ảnh bìa'}
          </Button>
          {wedding.cover && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                save(null).catch((e) => toast.error(errorMessage(e, 'Không lưu được')))
              }
            >
              Bỏ ảnh, về ảnh mẫu
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Nên dùng ảnh dọc. Tối đa 10 MB.</p>
    </section>
  )
}

function GallerySection({ wedding, uploadsEnabled, onSave }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const photos = wedding.gallery
  const canAdd = uploadsEnabled && progress === null && photos.length < LIMITS.photos

  async function save(next: Photo[]) {
    await onSave({ gallery: next })
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    void addFiles(files)
  }

  async function addFiles(all: File[]) {
    const images = all.filter((f) => f.type.startsWith('image/'))
    const files = images.slice(0, LIMITS.photos - photos.length)
    if (images.length > files.length) {
      toast.warning(`Album tối đa ${LIMITS.photos} ảnh, chỉ thêm ${files.length} ảnh đầu`)
    }
    if (!files.length) return

    const added: Photo[] = []
    try {
      for (const [i, file] of files.entries()) {
        setProgress(`Đang tải ${i + 1}/${files.length}…`)
        added.push(await uploadPhoto(file, ''))
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Có ảnh không tải lên được'))
    }
    try {
      if (added.length) {
        await save([...photos, ...added])
        toast.success(`Đã thêm ${added.length} ảnh`)
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Không lưu được album'))
    } finally {
      setProgress(null)
    }
  }

  function change(next: Photo[]) {
    save(next).catch((e) => toast.error(errorMessage(e, 'Không lưu được album')))
  }

  function remove(index: number) {
    const before = photos
    save(photos.filter((_, j) => j !== index))
      .then(() =>
        toast.success('Đã xoá ảnh', {
          action: { label: 'Hoàn tác', onClick: () => change(before) },
        }),
      )
      .catch((e) => toast.error(errorMessage(e, 'Không lưu được album')))
  }

  function move(index: number, delta: number) {
    const next = [...photos]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item)
    change(next)
  }

  return (
    <section className="grid gap-4">
      <SectionTitle
        aside={
          <span className="text-sm text-muted-foreground">
            {photos.length}/{LIMITS.photos} ảnh
          </span>
        }
      >
        Album ảnh
      </SectionTitle>

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p, i) => (
            <li
              key={p.src}
              className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
            >
              <WeddingImage
                src={p.src}
                alt={p.alt}
                fill
                sizes="(min-width: 640px) 160px, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                <span className="flex gap-1">
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="secondary"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    title="Đưa lên trước"
                  >
                    <ArrowLeft />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="secondary"
                    onClick={() => move(i, 1)}
                    disabled={i === photos.length - 1}
                    title="Đưa ra sau"
                  >
                    <ArrowRight />
                  </Button>
                </span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  onClick={() => remove(i)}
                  title="Xoá ảnh"
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input ref={input} type="file" accept="image/*" multiple hidden onChange={onPick} />
      {/* Kéo thả ảnh từ máy vào khung, hoặc bấm để chọn */}
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={!canAdd}
        onDragOver={(e) => {
          if (!canAdd) return
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (canAdd) void addFiles(Array.from(e.dataTransfer.files))
        }}
        className={cn(
          'flex flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition outline-none focus-visible:ring-3 focus-visible:ring-ring/40 enabled:hover:border-primary/50 enabled:hover:bg-primary/5 disabled:opacity-60',
          dragging && 'border-primary bg-primary/10',
        )}
      >
        {progress ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" />
        )}
        <span className="text-sm font-medium">
          {progress ??
            (photos.length >= LIMITS.photos
              ? 'Album đã đủ ảnh'
              : dragging
                ? 'Thả ảnh vào đây'
                : 'Kéo thả ảnh vào đây, hoặc bấm để chọn')}
        </span>
        <span className="text-xs text-muted-foreground">
          Chọn nhiều ảnh một lúc được · tối đa 10 MB mỗi ảnh
        </span>
      </button>
    </section>
  )
}

function MusicSection({ wedding, uploadsEnabled, onSave }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [link, setLink] = useState('')

  async function save(musicUrl: string | null) {
    await onSave(musicSchema.parse({ musicUrl }))
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPending(true)
    try {
      const uploaded = await uploadToCloudinary(file, 'audio')
      await save(uploaded.url)
      toast.success('Đã đổi nhạc nền')
    } catch (error) {
      toast.error(errorMessage(error, 'Không tải được nhạc'))
    } finally {
      setPending(false)
    }
  }

  async function onLink(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    try {
      await save(link.trim())
      setLink('')
      toast.success('Đã đổi nhạc nền')
    } catch (error) {
      toast.error(errorMessage(error, 'Link nhạc không hợp lệ'))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="grid gap-4">
      <SectionTitle>Nhạc nền</SectionTitle>
      {wedding.musicUrl ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
          <Music className="size-5 shrink-0 text-primary" />
          <audio controls src={wedding.musicUrl} className="h-9 w-full min-w-0 flex-1" />
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => save(null).catch((e) => toast.error(errorMessage(e, 'Không lưu được')))}
          >
            <Trash2 /> Bỏ nhạc
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có nhạc — thiệp sẽ không có nút nhạc.</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input ref={input} type="file" accept="audio/*" hidden onChange={onFile} />
        <Button
          type="button"
          variant="outline"
          onClick={() => input.current?.click()}
          disabled={!uploadsEnabled || pending}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Upload />}
          Tải file nhạc (≤ 8 MB)
        </Button>
      </div>

      <form onSubmit={onLink} className="flex items-end gap-2">
        <Field id="music-link" label="Hoặc dán link file nhạc" className="flex-1">
          <Input
            id="music-link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…/bai-hat.mp3"
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={!link.trim() || pending}>
          Dùng link
        </Button>
      </form>
    </section>
  )
}
