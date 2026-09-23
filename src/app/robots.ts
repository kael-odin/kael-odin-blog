import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://odin-saga.vercel.app'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [{ userAgent: '*', allow: '/', disallow: ['/write', '/write/*', '/api/*'] }],
		sitemap: `${SITE}/sitemap.xml`
	}
}
