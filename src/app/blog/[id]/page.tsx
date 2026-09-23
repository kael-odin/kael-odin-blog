import type { Metadata } from 'next'
import fs from 'node:fs/promises'
import path from 'node:path'
import BlogArticleView from './article-view'

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://odin-saga.vercel.app'

type BlogMetaConfig = {
	title?: string
	date?: string
	summary?: string
	cover?: string
	hidden?: boolean
	tags?: string[]
}

async function readBlogConfig(slug: string): Promise<BlogMetaConfig | null> {
	// slug 同时是目录名，只放行安全字符
	if (!/^[a-zA-Z0-9_-]{1,120}$/.test(slug)) return null
	try {
		const raw = await fs.readFile(path.join(process.cwd(), 'public', 'blogs', slug, 'config.json'), 'utf-8')
		return JSON.parse(raw) as BlogMetaConfig
	} catch {
		return null
	}
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params
	const config = await readBlogConfig(id)
	if (!config) return { title: '文章不存在' }

	const title = config.title || id
	const description = config.summary || `${title} - ${SITE_ORIGIN.replace(/^https?:\/\//, '')}`
	// 无封面的文章回退到站点头像，保证社交分享始终有图
	const ogImage = config.cover ? new URL(config.cover, SITE_ORIGIN).toString() : new URL('/images/avatar.png', SITE_ORIGIN).toString()
	const publishedTime = config.date ? new Date(config.date).toISOString() : undefined

	return {
		title,
		description,
		keywords: config.tags,
		openGraph: {
			title,
			description,
			type: 'article',
			publishedTime,
			tags: config.tags,
			images: [{ url: ogImage }]
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [ogImage]
		},
		// 已下线（hidden）的文章不让搜索引擎收录
		robots: config.hidden ? { index: false, follow: false } : undefined
	}
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return <BlogArticleView slug={id} />
}
