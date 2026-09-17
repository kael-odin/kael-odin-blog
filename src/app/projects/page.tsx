import type { Metadata } from 'next'
import Client from './client'

export const metadata: Metadata = {
	title: '我的项目',
	description: '项目展示与链接'
}

export default function Page() {
	return <Client />
}
