'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { ProjectCard, type Project } from './components/project-card'
import CreateDialog from './components/create-dialog'
import { pushProjects } from './services/push-projects'
import { useAuthStore } from '@/hooks/use-auth'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import initialList from './list.json'
import type { ImageItem } from './components/image-upload-dialog'

export default function Page() {
	const [projects, setProjects] = useState<Project[]>(initialList as Project[])
	const [originalProjects, setOriginalProjects] = useState<Project[]>(initialList as Project[])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [editingProject, setEditingProject] = useState<Project | null>(null)
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
	const [imageItems, setImageItems] = useState<Map<string, ImageItem>>(new Map())
	const [activeTag, setActiveTag] = useState<string | null>(null)
	const keyInputRef = useRef<HTMLInputElement>(null)

	const allTags = useMemo(() => Array.from(new Set((initialList as Project[]).flatMap(p => p.tags || []))).sort(), [initialList])
	const visibleProjects = useMemo(() => (activeTag ? projects.filter(p => (p.tags || []).includes(activeTag)) : projects), [projects, activeTag])

	const { isAuth, setPrivateKey } = useAuthStore()
	const { siteContent } = useConfigStore()
	const hideEditButton = siteContent.hideEditButton ?? false

	const handleUpdate = (updatedProject: Project, oldProject: Project, imageItem?: ImageItem) => {
		setProjects(prev => prev.map(p => (p.url === oldProject.url ? updatedProject : p)))
		if (imageItem) {
			setImageItems(prev => {
				const newMap = new Map(prev)
				newMap.set(updatedProject.url, imageItem)
				return newMap
			})
		}
	}

	const handleAdd = () => {
		setEditingProject(null)
		setIsCreateDialogOpen(true)
	}

	const handleSaveProject = (updatedProject: Project) => {
		if (editingProject) {
			const updated = projects.map(p => (p.url === editingProject.url ? updatedProject : p))
			setProjects(updated)
		} else {
			setProjects([...projects, updatedProject])
		}
	}

	const handleDelete = (project: Project) => {
		if (confirm(`确定要删除 ${project.name} 吗？`)) {
			setProjects(projects.filter(p => p.url !== project.url))
		}
	}

	const handleChoosePrivateKey = async (file: File) => {
		try {
			const text = await file.text()
			setPrivateKey(text)
			await handleSave()
		} catch (error) {
			console.error('Failed to read private key:', error)
			toast.error('读取密钥文件失败')
		}
	}

	const handleSaveClick = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			handleSave()
		}
	}

	const handleSave = async () => {
		setIsSaving(true)

		try {
			await pushProjects({
				projects,
				imageItems
			})

			setOriginalProjects(projects)
			setImageItems(new Map())
			setIsEditMode(false)
			toast.success('保存成功！')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setProjects(originalProjects)
		setImageItems(new Map())
		setIsEditMode(false)
	}

	const buttonText = isAuth ? '保存' : '导入密钥'

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isEditMode && (e.ctrlKey || e.metaKey) && e.key === ',') {
				e.preventDefault()
				setIsEditMode(true)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [isEditMode])

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handleChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<div className='flex flex-col items-center justify-center px-6 pt-32 pb-12'>
				{projects.length === 0 && !isEditMode ? (
					<div className='py-24 text-center'>
						<p className='text-secondary text-sm'>还没有展示的项目</p>
						<p className='text-secondary mt-2 text-xs opacity-70'>点击右上角「编辑」→「添加」，开始搭建你的项目墙</p>
					</div>
				) : (
					<>
						{!isEditMode && allTags.length > 0 && (
							<div className='mb-8 flex max-w-[1200px] flex-wrap items-center justify-center gap-2'>
								<button
									onClick={() => setActiveTag(null)}
									className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${activeTag === null ? 'brand-btn' : 'bg-card hover:bg-bg'}`}>
									全部
								</button>
								{allTags.map(tag => (
									<button
										key={tag}
										onClick={() => setActiveTag(activeTag === tag ? null : tag)}
										className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${activeTag === tag ? 'brand-btn' : 'bg-card hover:bg-bg'}`}>
										{tag}
									</button>
								))}
							</div>
						)}
						<div className='grid w-full max-w-[1200px] grid-cols-2 gap-6 max-md:grid-cols-1'>
							{visibleProjects.map((project, index) => (
								<ProjectCard key={project.url} project={project} isEditMode={isEditMode} onUpdate={handleUpdate} onDelete={() => handleDelete(project)} />
							))}
						</div>
					</>
				)}
			</div>

			<motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='absolute top-4 right-6 flex gap-3 max-sm:hidden'>
				{isEditMode ? (
					<>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleCancel}
							disabled={isSaving}
							className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							取消
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleAdd}
							className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							添加
						</motion.button>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>
							{isSaving ? '保存中...' : buttonText}
						</motion.button>
					</>
				) : (
					!hideEditButton && (
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setIsEditMode(true)}
							className='bg-card rounded-xl border px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80'>
							编辑
						</motion.button>
					)
				)}
			</motion.div>

			{isCreateDialogOpen && <CreateDialog project={editingProject} onClose={() => setIsCreateDialogOpen(false)} onSave={handleSaveProject} />}
		</>
	)
}
