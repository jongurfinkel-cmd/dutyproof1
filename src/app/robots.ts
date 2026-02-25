import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/billing',
          '/facilities',
          '/history',
          '/watches',
          '/checkin/',
          '/checklist/',
        ],
      },
    ],
    sitemap: 'https://dutyproof.com/sitemap.xml',
  }
}
