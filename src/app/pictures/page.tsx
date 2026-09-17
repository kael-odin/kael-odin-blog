import type { Metadata } from 'next'
import Client from './client'

export type { Picture } from './client'

export const metadata: Metadata = {
	title: '照片墙',
	description: '照片随手拍'
}

export default function Page() {
	return <Client />
}
