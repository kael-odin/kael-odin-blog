import { motion } from 'motion/react'
import { useWriteStore } from '../stores/write-store'
import { usePreviewStore } from '../stores/preview-store'
import { INIT_DELAY } from '@/consts'
import { useEffect, useRef, useState } from 'react'
import { buildDraftPayload, draftKey, formatDraftTime, saveDraft } from '../services/draft-store'

const defaultText = 'text'

/** 由标题生成 slug：拉丁字符直接用，中文转拼音（按需加载 pinyin-pro） */
async function suggestSlug(title: string): Promise<string> {
	const base = title
		.toLowerCase()
		.replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
		.trim()
	if (!base) return ''
	try {
		const mod: any = await import('pinyin-pro')
		const pinyin = mod?.pinyin ?? mod?.default?.pinyin
		if (pinyin) {
			const py: string[] = pinyin(base, { toneType: 'none', type: 'array', nonZh: 'consecutive' } as const)
			return (
				py
					.join('-')
					.toLowerCase()
					.replace(/[^a-z0-9-]/g, '')
					.replace(/-+/g, '-')
					.replace(/^-|-$/g, '')
					.slice(0, 60) || ''
			)
		}
	} catch {
		// 库加载失败退回拉丁字符
	}
	return base.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60)
}

export function WriteEditor() {
	const { form, updateForm, images, addFiles } = useWriteStore()
	const { mode, originalSlug } = useWriteStore()
	const livePreview = usePreviewStore(state => state.livePreview)
	const toggleLivePreview = usePreviewStore(state => state.toggleLivePreview)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [savedAt, setSavedAt] = useState<number | null>(null)

	// 自动保存到本地草稿：表单/封面/图片任一变化后 800ms 落盘
	useEffect(() => {
		let timer: ReturnType<typeof setTimeout> | null = null
		const unsub = useWriteStore.subscribe((state, prev) => {
			if (state.form === prev.form && state.cover === prev.cover && state.images === prev.images) return
			if (timer) clearTimeout(timer)
			timer = setTimeout(() => {
				const { form, cover, images, mode, originalSlug } = useWriteStore.getState()
				saveDraft(draftKey(mode, originalSlug), buildDraftPayload(form, cover, images))
				setSavedAt(Date.now())
			}, 800)
		})

		// 关闭/切换页签前立即补存，避免最后几秒输入丢失
		const flush = () => {
			if (timer) clearTimeout(timer)
			const { form, cover, images, mode, originalSlug } = useWriteStore.getState()
			saveDraft(draftKey(mode, originalSlug), buildDraftPayload(form, cover, images))
		}
		window.addEventListener('pagehide', flush)
		return () => {
			unsub()
			window.removeEventListener('pagehide', flush)
			if (timer) clearTimeout(timer)
		}
	}, [])

	const insertText = (text: string) => {
		const textarea = textareaRef.current
		if (!textarea) return

		textarea.focus()
		// Use execCommand to preserve undo/redo stack
		const success = document.execCommand('insertText', false, text)

		if (!success) {
			// Fallback for browsers that don't support execCommand
			const { selectionStart, selectionEnd, value } = textarea
			const before = value.substring(0, selectionStart)
			const after = value.substring(selectionEnd)
			updateForm({ md: before + text + after })
			setTimeout(() => {
				textarea.setSelectionRange(selectionStart + text.length, selectionStart + text.length)
				textarea.focus()
			}, 0)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		const textarea = textareaRef.current
		if (!textarea) return

		const { selectionStart, selectionEnd, value } = textarea
		const selectedText = value.substring(selectionStart, selectionEnd)

		// Ctrl/Cmd + B: Toggle Bold
		if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
			e.preventDefault()
			const before = value.substring(0, selectionStart)
			const after = value.substring(selectionEnd)

			// Check if already bold
			const isBold = before.endsWith('**') && after.startsWith('**')

			if (isBold && selectedText) {
				// Remove bold - select including markers and replace
				textarea.setSelectionRange(selectionStart - 2, selectionEnd + 2)
				insertText(selectedText)
			} else {
				// Add bold
				const text = selectedText || defaultText
				insertText(`**${text}**`)
				if (!selectedText) {
					setTimeout(() => {
						textarea.setSelectionRange(selectionStart + 2, selectionStart + 2 + defaultText.length)
					}, 0)
				}
			}
			return
		}

		// Ctrl/Cmd + I: Toggle Italic
		if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
			e.preventDefault()
			const before = value.substring(0, selectionStart)
			const after = value.substring(selectionEnd)

			// Check if already italic
			const isItalic = before.endsWith('*') && after.startsWith('*') && !(before.endsWith('**') && after.startsWith('**'))

			if (isItalic && selectedText) {
				// Remove italic and replace
				textarea.setSelectionRange(selectionStart - 1, selectionEnd + 1)
				insertText(selectedText)
			} else {
				// Add italic
				const text = selectedText || defaultText
				insertText(`*${text}*`)
				if (!selectedText) {
					// Select the default text
					setTimeout(() => {
						textarea.setSelectionRange(selectionStart + 1, selectionStart + 1 + defaultText.length)
					}, 0)
				}
			}
			return
		}

		// Ctrl/Cmd + K: Link
		if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
			e.preventDefault()
			const text = selectedText || defaultText
			insertText(`[${text}](url)`)
			// Select 'url' part
			setTimeout(() => {
				const urlStart = selectionStart + text.length + 3
				textarea.setSelectionRange(urlStart, urlStart + 3)
			}, 0)
			return
		}

		// Tab: Indent
		if (e.key === 'Tab' && !e.shiftKey) {
			e.preventDefault()
			insertText('\t')
			return
		}

		// Shift + Tab: Outdent
		if (e.key === 'Tab' && e.shiftKey) {
			e.preventDefault()
			const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
			const line = value.substring(lineStart, value.indexOf('\n', selectionStart))

			if (line.startsWith('\t')) {
				textarea.setSelectionRange(lineStart, lineStart + 1)
				insertText('')
			} else if (line.startsWith('  ')) {
				textarea.setSelectionRange(lineStart, lineStart + 2)
				insertText('')
			}
			return
		}
	}

	const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
		const items = e.clipboardData.items
		if (!items) return

		const imageFiles: File[] = []
		for (let i = 0; i < items.length; i++) {
			const item = items[i]
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile()
				if (file) {
					imageFiles.push(file)
				}
			}
		}

		if (imageFiles.length > 0) {
			e.preventDefault()

			const resultImages = await addFiles(imageFiles).catch(() => [])

			if (resultImages && resultImages.length > 0) {
				// 为所有处理后的图片（包括新添加和已存在的）生成 markdown
				const markdowns = resultImages.map(item => (item.type === 'url' ? `![](${item.url})` : `![](local-image:${item.id})`)).join('\n')
				insertText(markdowns)
			}
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: INIT_DELAY }}
			className='bg-card flex min-h-[800px] w-[800px] flex-col rounded-[40px] border p-6 shadow'>
			<div className='mb-3 flex gap-3'>
				<input
					type='text'
					placeholder='标题'
					className='bg-card flex-1 rounded-lg border px-3 py-2 text-sm'
					value={form.title}
					onChange={e => {
						const title = e.target.value
						// 新建模式下标题为空 slug 时自动生成（拼音）
						if (mode === 'create' && !form.slug && title.trim()) {
							updateForm({ title })
							suggestSlug(title).then(slug => {
								if (slug && !useWriteStore.getState().form.slug) {
									updateForm({ slug })
								}
							})
						} else {
							updateForm({ title })
						}
					}}
				/>
				<input
					type='text'
					placeholder='slug（xx-xx）'
					className='bg-card w-[200px] rounded-lg border px-3 py-2 text-sm'
					value={form.slug}
					onChange={e => updateForm({ slug: e.target.value })}
				/>
				<button
					type='button'
					onClick={toggleLivePreview}
					className={`hidden shrink-0 rounded-lg border px-3 py-2 text-xs transition-colors 2xl:block ${livePreview ? 'brand-btn' : 'bg-card hover:bg-bg'}`}
					title='宽屏分屏实时预览'>
					预览
				</button>
			</div>
			<textarea
				ref={textareaRef}
				placeholder='Markdown 内容'
				className='bg-card h-[650px] w-full flex-1 resize-none rounded-xl border p-4 text-sm'
				value={form.md}
				onChange={e => updateForm({ md: e.target.value })}
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
			/>
			<div className='text-secondary mt-2 flex items-center justify-between px-1 text-xs opacity-70'>
				<span>{savedAt ? `已自动保存本地草稿 ${formatDraftTime(savedAt)}` : '内容修改后会自动保存本地草稿'}</span>
				<span>Ctrl+B 加粗 · Ctrl+I 斜体 · Ctrl+K 链接</span>
			</div>
		</motion.div>
	)
}
