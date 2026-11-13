import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { AppHeader } from '@/components/dashboard/app-header'
import { WeddingEditor } from '@/components/dashboard/editor/wedding-editor'
import { HttpError } from '@/server/http'
import { requirePageUser } from '@/server/session'
import { getCloudinaryConfig } from '@/server/services/uploads'
import { getWeddingForEdit } from '@/server/services/weddings'

export default function EditWeddingPage({ params }: PageProps<'/dashboard/[id]'>) {
  return (
    <>
      <AppHeader />
      <main>
        <Suspense fallback={<EditorSkeleton />}>
          <Editor params={params} />
        </Suspense>
      </main>
    </>
  )
}

async function Editor({ params }: Pick<PageProps<'/dashboard/[id]'>, 'params'>) {
  const { id } = await params
  const user = await requirePageUser(`/dashboard/${id}`)
  const wedding = await getWeddingForEdit(user.id, id).catch((error: unknown) => {
    // Không phải thành viên của thiệp → coi như không tồn tại
    if (error instanceof HttpError && error.status === 404) notFound()
    throw error
  })

  return (
    <WeddingEditor
      initial={wedding}
      uploadsEnabled={getCloudinaryConfig() !== null}
      currentUserId={user.id}
    />
  )
}

function EditorSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto w-full max-w-6xl px-4 pt-10">
      <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="mt-8 h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
