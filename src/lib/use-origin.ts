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

/** Địa chỉ thiệp gửi cho khách: NEXT_PUBLIC_SITE_URL nếu có, không thì origin của trang */
export function useSiteOrigin() {
  const origin = useOrigin()
  return process.env.NEXT_PUBLIC_SITE_URL || origin
}
