import type { Metadata } from 'next'
import Client from './client'

export const metadata: Metadata = {
	title: '碎语',
	description: '一句话随想'
}

export default function Page() {
	return <Client />
}
