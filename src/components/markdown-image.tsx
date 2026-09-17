'use client'

import { useState } from 'react'
import { DialogModal } from '@/components/dialog-modal'

const VIDEO_EXT = /\.(mp4|webm|ogv|ogg|mov|m4v)(\?|$)/i

export function isVideoSrc(src: string): boolean {
	return VIDEO_EXT.test(src || '')
}

type MarkdownImageProps = {
	src: string
	alt?: string
	title?: string
}

export function MarkdownImage({ src, alt = '', title = '' }: MarkdownImageProps) {
	const [display, setDisplay] = useState(false)

	// 视频文件（本地上传的 mp4/webm 等）用 <video> 播放，不做灯箱
	if (isVideoSrc(src)) {
		return <video src={src} controls preload='metadata' className='my-2 w-full rounded-xl' />
	}

	return (
		<>
			<img src={src} alt={alt} title={title} loading='lazy' onClick={() => setDisplay(true)} className='cursor-pointer transition-opacity hover:opacity-80' />
			<DialogModal open={display} onClose={() => setDisplay(false)} className='max-w-none bg-transparent p-0'>
				<img src={src} alt={alt} className='max-h-[90vh] max-w-full rounded-2xl object-contain' />
			</DialogModal>
		</>
	)
}
