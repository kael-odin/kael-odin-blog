'use client'

import { useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import dayjs from 'dayjs'
import { useWriteStore } from '../stores/write-store'
import { usePreviewStore, initLivePreview } from '../stores/preview-store'
import { useMarkdownRender } from '@/hooks/use-markdown-render'

/** 编辑器右侧分屏实时预览（仅宽屏显示，可用按钮开关） */
export function WriteLivePreview() {
	const { form } = useWriteStore()
	const livePreview = usePreviewStore(state => state.livePreview)
	const toggleLivePreview = usePreviewStore(state => state.toggleLivePreview)
	const { content, loading } = useMarkdownRender(form.md)

	useEffect(() => {
		initLivePreview()
	}, [])

	const dateText = useMemo(() => {
		const d = form.date ? dayjs(form.date) : dayjs()
		return d.isValid() ? d.format('YYYY年 M月 D日') : ''
	}, [form.date])

	if (!livePreview) return null

	return (
		<motion.aside
			initial={{ opacity: 0, x: 24 }}
			animate={{ opacity: 1, x: 0 }}
			className='bg-article sticky top-24 hidden h-[calc(100vh-9rem)] w-[320px] shrink-0 flex-col overflow-hidden rounded-[40px] border shadow 2xl:flex'>
			<div className='flex items-center justify-between border-b px-6 py-4'>
				<span className='text-secondary text-xs'>实时预览</span>
				<button onClick={toggleLivePreview} className='text-secondary text-xs transition-colors hover:text-gray-600 dark:text-gray-300'>
					关闭
				</button>
			</div>
			<div className='flex-1 overflow-y-auto px-6 py-5'>
				<h1 className='text-xl font-semibold'>{form.title || '无标题'}</h1>
				<div className='text-secondary mt-2 flex items-center gap-3 text-xs'>
					<span>{dateText}</span>
					{form.tags?.map(tag => (
						<span key={tag} className='bg-secondary/10 rounded px-2 py-0.5'>
							{tag}
						</span>
					))}
				</div>
				<div className='mt-5 text-sm leading-relaxed'>{loading ? <span className='text-secondary text-xs'>渲染中...</span> : content}</div>
			</div>
		</motion.aside>
	)
}
