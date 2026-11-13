import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Ảnh cặp đôi upload nằm trên Cloudinary (resize qua loader trong WeddingImage)
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
}

export default nextConfig
