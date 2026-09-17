import type { Metadata } from 'next'
import Client from './client'

export const metadata: Metadata = {
	title: '图片压缩',
	description: '浏览器端图片转 WebP 工具'
}

export default function Page() {
	return <Client />
}
