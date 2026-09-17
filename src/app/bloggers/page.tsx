import type { Metadata } from 'next'
import Client from './client'

export const metadata: Metadata = {
	title: '优秀博客',
	description: '友情链接与博客推荐'
}

export default function Page() {
	return <Client />
}
