import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs/promises'
import { GITHUB_CONFIG } from '@/consts'

/**
 * 点赞计数后端（服务端专用，勿在客户端引入）。
 * 数据存储在仓库根目录的 likes.json，通过 GitHub Contents API 读改写，
 * 授权优先使用环境变量 GITHUB_APP_PRIVATE_KEY（GitHub App 私钥，签 JWT 换安装令牌），
 * 其次使用 GITHUB_TOKEN（细粒度 PAT，需本仓库 Contents 读写权限）。
 */

const FILE_PATH = 'likes.json'
const RAW_URL = `https://raw.githubusercontent.com/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/${GITHUB_CONFIG.BRANCH}/${FILE_PATH}`
const GH_API = 'https://api.github.com'
const GH_HEADERS = {
	Accept: 'application/vnd.github+json',
	'X-GitHub-Api-Version': '2022-11-28'
}

export function hasWriteCredential(): boolean {
	return Boolean(process.env.GITHUB_APP_PRIVATE_KEY || process.env.GITHUB_TOKEN)
}

export function sanitizeSlug(raw: string | null | undefined): string {
	return (raw || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
}

function signAppJwt(appId: string, privateKeyPem: string): string {
	const now = Math.floor(Date.now() / 1000)
	const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url')
	const pem = privateKeyPem.includes('\\n') ? privateKeyPem.replace(/\\n/g, '\n') : privateKeyPem
	const input = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iat: now - 60, exp: now + 480, iss: appId })}`
	const signature = crypto.createSign('RSA-SHA256').update(input).sign(pem, 'base64url')
	return `${input}.${signature}`
}

async function getInstallToken(): Promise<string> {
	const appId = process.env.NEXT_PUBLIC_GITHUB_APP_ID || '-'
	const pem = process.env.GITHUB_APP_PRIVATE_KEY
	if (!pem) throw new Error('missing credential')

	const jwt = signAppJwt(appId, pem)
	const installationRes = await fetch(`${GH_API}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/installation`, {
		headers: { ...GH_HEADERS, Authorization: `Bearer ${jwt}` }
	})
	if (!installationRes.ok) throw new Error(`installation lookup failed: ${installationRes.status}`)
	const { id } = (await installationRes.json()) as { id: number }

	const tokenRes = await fetch(`${GH_API}/app/installations/${id}/access_tokens`, {
		method: 'POST',
		headers: { ...GH_HEADERS, Authorization: `Bearer ${jwt}` }
	})
	if (!tokenRes.ok) throw new Error(`create installation token failed: ${tokenRes.status}`)
	const { token } = (await tokenRes.json()) as { token: string }
	return token
}

async function getCredential(): Promise<string> {
	if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN
	return getInstallToken()
}

type LikesMap = Record<string, number>

async function readLikesFromGithub(): Promise<LikesMap> {
	const res = await fetch(RAW_URL, { cache: 'no-store' })
	if (res.status === 404) return {}
	if (!res.ok) throw new Error(`read likes failed: ${res.status}`)
	return (await res.json()) as LikesMap
}

export async function readLikes(): Promise<LikesMap> {
	try {
		return await readLikesFromGithub()
	} catch {
		// 回退到构建时打包进部署的文件（raw 有分钟级缓存或首次未推送时）
		try {
			const local = await fs.readFile(path.join(process.cwd(), FILE_PATH), 'utf-8')
			return JSON.parse(local) as LikesMap
		} catch {
			return {}
		}
	}
}

async function writeLikes(likes: LikesMap, message: string): Promise<void> {
	const token = await getCredential()
	const headers = { ...GH_HEADERS, Authorization: `Bearer ${token}` }

	const shaRes = await fetch(`${GH_API}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${FILE_PATH}`, { headers })
	const sha = shaRes.ok ? ((await shaRes.json()) as { sha: string }).sha : undefined

	const putRes = await fetch(`${GH_API}/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${FILE_PATH}`, {
		method: 'PUT',
		headers,
		body: JSON.stringify({
			message,
			content: Buffer.from(JSON.stringify(likes, null, '\t') + '\n', 'utf-8').toString('base64'),
			...(sha ? { sha } : {})
		})
	})
	if (!putRes.ok) throw new Error(`write likes failed: ${putRes.status}`)
}

/** 读-改-写某个 slug 的计数，冲突时重试一次 */
export async function incrementLike(slug: string, delta: number): Promise<number> {
	for (let attempt = 0; attempt < 2; attempt++) {
		const likes = await readLikesFromGithub().catch((): LikesMap => ({}))
		const next = (likes[slug] ?? 0) + delta
		try {
			await writeLikes({ ...likes, [slug]: Math.max(0, next) }, `❤️ like: ${slug} ${delta > 0 ? '+1' : delta}`)
			return Math.max(0, next)
		} catch (err) {
			if (attempt === 1) throw err
		}
	}
	throw new Error('unreachable')
}
