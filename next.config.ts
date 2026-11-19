import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  // Xuất site tĩnh vào out/ để đưa lên Firebase Hosting (gói Spark không chạy được server)
  output: 'export',
  images: {
    // Không có server tối ưu ảnh: ảnh Cloudinary resize qua URL, ảnh trong public/ dùng nguyên
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
  // Trên Firebase Hosting, /m/** được rewrite sang /m.html (firebase.json).
  // Khi chạy next dev thì làm việc đó ở đây.
  ...(isDev && {
    async rewrites() {
      return [{ source: '/m/:code', destination: '/m' }]
    },
  }),
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
