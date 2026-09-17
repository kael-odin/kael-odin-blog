'use client'

import { useEffect, useState } from 'react'

// 会话内缓存，避免重复请求 GitHub API（未认证限额 60 次/小时/IP）
const cache = new Map<string, number>()

/** 从 github 仓库链接拉取并展示 star 数；失败或非仓库链接时不渲染 */
export function GithubStars({ url }: { url: string }) {
	const [stars, setStars] = useState<number | null>(() => cache.get(url) ?? null)

	useEffect(() => {
		if (cache.has(url)) return
		let cancelled = false
		;(async () => {
			try {
				const m = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/)
				if (!m) return
				const res = await fetch(`https://api.github.com/repos/${m[1]}/${m[2]}`, {
					headers: { Accept: 'application/vnd.github+json' }
				})
				if (!res.ok) return
				const data = await res.json()
				if (typeof data?.stargazers_count === 'number') {
					cache.set(url, data.stargazers_count)
					if (!cancelled) setStars(data.stargazers_count)
				}
			} catch {
				// 网络失败静默
			}
		})()
		return () => {
			cancelled = true
		}
	}, [url])

	if (stars === null) return null
	return (
		<span className='bg-card inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium tabular-nums' title={`${stars} stars`}>
			<svg viewBox='0 0 24 24' width='13' height='13' fill='currentColor' className='text-amber-400'>
				<path d='M12 2l2.9 6.26L21.5 9.3l-4.75 4.87 1.02 7.08L12 17.77l-5.77 3.48 1.02-7.08L2.5 9.3l6.6-1.04L12 2z' />
			</svg>
			{stars}
		</span>
	)
}
