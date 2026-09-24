import { MetadataRoute } from 'next'
import blogIndex from '@/../public/blogs/index.json'
import type { BlogIndexItem } from '@/app/blog/types'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	// 域名配置：统一使用 NEXT_PUBLIC_SITE_URL（与 robots.ts / rss.xml 一致）。
	// 之前回退 VERCEL_URL 会把「部署 hash 域名」烤进 sitemap 产物。
	const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://odin-saga.vercel.app').replace(/\/$/, '')


	// hidden 文章不进 sitemap，避免被搜索引擎收录
	const posts: BlogIndexItem[] = (blogIndex as BlogIndexItem[]).filter(post => post?.slug && !post.hidden)

	const postEntries: MetadataRoute.Sitemap = posts.map(post => ({
		url: `${baseUrl}/blog/${post.slug}`,
		lastModified: post.date ? new Date(post.date) : new Date(),
		changeFrequency: 'weekly',
		priority: 0.8
	}))

	const staticEntries: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1
		}
	]

	return [...staticEntries, ...postEntries]
}
