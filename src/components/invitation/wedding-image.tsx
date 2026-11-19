'use client'

import Image, { type ImageProps } from 'next/image'

/** next/image của thiệp. Resize ảnh Cloudinary nằm ở loader chung (src/lib/image-loader.ts). */
export function WeddingImage({ alt, ...props }: ImageProps) {
  return <Image alt={alt} {...props} />
}
