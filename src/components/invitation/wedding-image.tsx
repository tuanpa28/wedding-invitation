'use client'

import Image, { type ImageLoader, type ImageProps } from 'next/image'

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/

/** Ảnh trên Cloudinary: để Cloudinary tự resize + đổi định dạng (không tốn quota tối ưu ảnh của Vercel) */
const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  const match = CLOUDINARY_UPLOAD.exec(src)
  if (!match) return src
  return `${match[1]}f_auto,q_${quality ?? 'auto'},c_limit,w_${width}/${match[2]}`
}

/** next/image dùng loader của Cloudinary cho ảnh upload, ảnh mẫu trong /public đi đường mặc định */
export function WeddingImage({ alt, ...props }: ImageProps) {
  const isCloudinary = typeof props.src === 'string' && CLOUDINARY_UPLOAD.test(props.src)
  return <Image alt={alt} {...props} loader={isCloudinary ? cloudinaryLoader : undefined} />
}
