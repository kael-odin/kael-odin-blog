import type { Metadata } from 'next'
import Client from './client'

export const metadata: Metadata = {
	title: '博客文章',
	description: 'Kael 的文章列表'
}

export default function Page() {
	return <Client />
}
