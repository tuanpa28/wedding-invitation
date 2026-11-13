import { Suspense } from 'react'
import { AppHeader } from '@/components/dashboard/app-header'
import { CreateWeddingWizard } from '@/components/dashboard/create-wedding-wizard'
import { requirePageUser } from '@/server/session'

export default function NewWeddingPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
          <Wizard />
        </Suspense>
      </main>
    </>
  )
}

async function Wizard() {
  await requirePageUser('/dashboard/new')
  return <CreateWeddingWizard />
}
