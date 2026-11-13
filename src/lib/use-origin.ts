'use client'

import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/** Origin của trang (vd. https://thiep-hong.vercel.app). Server render trả chuỗi rỗng. */
export function useOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => '',
  )
}
