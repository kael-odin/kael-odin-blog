'use client'

import { useEffect, useRef } from 'react'
import { useConfigStore } from '../app/(home)/stores/config-store'

/**
 * giscus 评论（基于 GitHub Discussions）。
 * 默认关闭；启用方法：
 * 1. 给仓库开启 Discussions 并安装 giscus App（https://giscus.app/zh-CN）
 * 2. 在 giscus.app 生成参数，填入 src/config/site-content.json 的 comments.giscus
 * 3. enabled 改为 true，保存站点配置即可
 */
export function GiscusComments({ slug, title }: { slug: string; title?: string }) {
	const { siteContent } = useConfigStore()
	const giscus = siteContent.comments?.giscus
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!giscus?.enabled || !giscus.repo || !giscus.repoId || !giscus.categoryId || !containerRef.current) return

		const container = containerRef.current
		container.innerHTML = ''

		const script = document.createElement('script')
		script.src = 'https://giscus.app/client.js'
		script.async = true
		script.crossOrigin = 'anonymous'
		script.setAttribute('data-repo', giscus.repo)
		script.setAttribute('data-repo-id', giscus.repoId)
		script.setAttribute('data-category', giscus.category)
		script.setAttribute('data-category-id', giscus.categoryId)
		script.setAttribute('data-mapping', 'pathname')
		script.setAttribute('data-strict', '0')
		script.setAttribute('data-reactions-enabled', '1')
		script.setAttribute('data-emit-metadata', '0')
		script.setAttribute('data-input-position', 'top')
		script.setAttribute('data-theme', 'light')
		script.setAttribute('data-lang', 'zh-CN')
		script.setAttribute('data-loading', 'lazy')
		container.appendChild(script)

		return () => {
			container.innerHTML = ''
		}
	}, [slug, giscus?.enabled, giscus?.repo, giscus?.repoId, giscus?.categoryId, giscus?.category, title])

	if (!giscus?.enabled || !giscus.repo) return null

	return (
		<div className='mx-auto mt-10 w-full max-w-[820px] px-4'>
			<h2 className='text-secondary mb-4 text-sm font-medium'>评论</h2>
			<div ref={containerRef} className='min-h-[200px]' />
		</div>
	)
}
