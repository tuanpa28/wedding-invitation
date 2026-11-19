'use client'

import type { ImageLoaderProps } from 'next/image'

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/

/**
 * Loader cho mọi next/image (site tĩnh, không có server tối ưu ảnh):
 * - Ảnh Cloudinary: để Cloudinary resize + chọn định dạng (webp/avif) theo đúng bề rộng cần.
 * - Ảnh trong public/: dùng nguyên file (đã được thu nhỏ sẵn).
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps) {
  const match = CLOUDINARY_UPLOAD.exec(src)
  if (!match) return src
  return `${match[1]}f_auto,q_${quality ?? 'auto'},c_limit,w_${width}/${match[2]}`
}
