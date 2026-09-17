import type { Metadata } from 'next'
import Client from './client'

export const metadata: Metadata = {
	title: '推荐分享',
	description: '收藏的网站与资源'
}

export default function Page() {
	return <Client />
}
