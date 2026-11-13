'use client'

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Music, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { toast } from 'sonner'
import { WeddingImage } from '@/components/invitation/wedding-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, ApiError, uploadFile } from '@/lib/api-client'
import { DEFAULT_COVER, LIMITS } from '@/lib/invitation/defaults'
import type { Photo } from '@/lib/invitation/types'
import type { GalleryPhotoInput } from '@/lib/validators/wedding'
import type { WeddingEditData } from '@/server/services/weddings'
import { Field, SectionTitle } from './field'

type Props = {
  wedding: WeddingEditData
  uploadsEnabled: boolean
  onSaved: (patch: Partial<WeddingEditData>) => void
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback

/** Ảnh bìa, album và nhạc nền. Mỗi thay đổi được lưu ngay. */
export function MediaForm({ wedding, uploadsEnabled, onSaved }: Props) {
  return (
    <div className="flex flex-col gap-10">
      {!uploadsEnabled && (
        <p className="rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
          Chưa cấu hình Cloudinary nên chưa tải ảnh/nhạc lên được. Thiệp đang dùng ảnh bìa mặc định.
          Thêm <code className="font-mono text-foreground">CLOUDINARY_*</code> vào{' '}
          <code className="font-mono text-foreground">.env.local</code> theo README.
        </p>
      )}
      <CoverSection wedding={wedding} uploadsEnabled={uploadsEnabled} onSaved={onSaved} />
      <GallerySection wedding={wedding} uploadsEnabled={uploadsEnabled} onSaved={onSaved} />
      <MusicSection wedding={wedding} uploadsEnabled={uploadsEnabled} onSaved={onSaved} />
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

async function uploadPhoto(weddingId: string, file: File, alt: string): Promise<GalleryPhotoInput> {
  const uploaded = await uploadFile(weddingId, 'image', file)
  const size =
    uploaded.width && uploaded.height
      ? { width: uploaded.width, height: uploaded.height }
      : await imageSize(file)
  return { src: uploaded.url, ...size, alt, publicId: uploaded.publicId }
}

function CoverSection({ wedding, uploadsEnabled, onSaved }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const cover = wedding.cover ?? DEFAULT_COVER

  async function save(next: Photo | null) {
    await api(`/api/weddings/${wedding.id}`, { method: 'PATCH', body: { cover: next } })
    onSaved({ cover: next })
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPending(true)
    try {
      const { src, width, height, alt } = await uploadPhoto(wedding.id, file, 'Ảnh bìa')
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
              Ảnh mặc định
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
              Dùng ảnh mặc định
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Nên dùng ảnh dọc. Tối đa 10 MB.</p>
    </section>
  )
}

function GallerySection({ wedding, uploadsEnabled, onSaved }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const photos = wedding.photos

  async function save(next: GalleryPhotoInput[]) {
    await api(`/api/weddings/${wedding.id}/photos`, { method: 'PUT', body: { photos: next } })
    onSaved({ photos: next })
  }

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, LIMITS.photos - photos.length)
    event.target.value = ''
    if (!files.length) return

    const added: GalleryPhotoInput[] = []
    try {
      for (const [i, file] of files.entries()) {
        setProgress(`Đang tải ${i + 1}/${files.length}…`)
        added.push(await uploadPhoto(wedding.id, file, ''))
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

  function change(next: GalleryPhotoInput[]) {
    save(next).catch((e) => toast.error(errorMessage(e, 'Không lưu được album')))
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
                  onClick={() => change(photos.filter((_, j) => j !== i))}
                  title="Xoá ảnh"
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={onFiles} />
        <Button
          type="button"
          variant="outline"
          onClick={() => input.current?.click()}
          disabled={!uploadsEnabled || progress !== null || photos.length >= LIMITS.photos}
        >
          {progress ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {progress ?? 'Thêm ảnh'}
        </Button>
        <p className="text-xs text-muted-foreground">Chọn nhiều ảnh một lúc được.</p>
      </div>
    </section>
  )
}

function MusicSection({ wedding, uploadsEnabled, onSaved }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState(false)
  const [link, setLink] = useState('')

  async function save(musicUrl: string | null) {
    await api(`/api/weddings/${wedding.id}`, { method: 'PATCH', body: { musicUrl } })
    onSaved({ musicUrl })
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPending(true)
    try {
      const uploaded = await uploadFile(wedding.id, 'audio', file)
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
