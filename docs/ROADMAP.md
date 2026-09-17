# kael-odin-blog 改进路线图

> 2026-09-18 凌晨自主改进会话产出。基础：fork 自 YYsuni/2025-blog-public 的 Next.js 博客，Vercel 部署，GitHub App 网页端编辑内容回写仓库。

## ✅ 本次已完成（已上线验证）

### P0 — 写作可靠性
| 项 | 说明 | 验证 |
| --- | --- | --- |
| 草稿 + 自动保存 | 编辑器每 800ms 存 localStorage，`pagehide` 兜底；≤400KB 图片随草稿转 dataURL 保存；刷新后自动恢复并提示；发布/删除成功自动清草稿 | 构建通过，逻辑评审 |
| 真正的上下线 | hidden 文章：RSS / sitemap 排除、文章页 robots noindex、访客侧显示「文章不存在」（已认证不受影响） | 线上实测：RSS/sitemap 排除 ✅、noindex ✅ |
| slug 查重 + 校验 | 新建时远端查重防覆盖旧文；slug 字符集/长度校验、标题必填（错误先于鉴权提示） | 构建通过 |
| 修 bug | 照片页删除按钮缺 `group` 类永远不可见；首页拖拽布局「保存」现在真实提交 card-styles.json（含密钥引导）；meta-section console.log | 构建通过 |
| 点赞实时化 | GET 读数改走 Contents API（installation token 内存缓存 45min），消除 raw CDN 5 分钟延迟；前端失败不再假 +1 | 线上实测：POST 后立即 GET=1 ✅ |
| 文章页 SEO | `/blog/[id]` 改服务端包裹 + `generateMetadata`：文章级 title/description/OG 图/发布时间/keywords | 线上实测：og:title ✅ |

### P1 — 内容能力
| 项 | 说明 |
| --- | --- |
| 图片自动压缩 | 编辑器入库图片自动转 WebP（quality 0.82、超宽缩至 1920、压缩无收益则保留原图），共享工具 `src/lib/image-compress.ts` |
| 视频支持 | 正文单独一行粘贴 B站/YouTube 链接自动转 16:9 嵌入播放器（`video-embed.tsx`）；编辑器支持本地上传 mp4/webm（≤80MB），正文渲染 `<video>` |
| Mermaid 图表 | ` ```mermaid ` 代码块渲染为 SVG（securityLevel=strict），失败降级为普通代码块 |
| XSS 消毒 | 文章 HTML 全量过 DOMPurify（白名单放行 iframe 等合法嵌入） |
| 项目页升级 | 可选 16:9 封面大图、GitHub star 数展示（会话缓存）、标签筛选、空状态提示 |
| 编辑器分屏预览 | 宽屏（2xl）右侧实时预览，开关持久化；slug 由标题自动生成（中文转拼音，按需加载 pinyin-pro） |

### P2 — 体验与清理
- 音乐卡歌单化：`src/config/playlist.json` 追加 `{name,url}` 即可加歌，自动连播/跳错曲。
- giscus 评论脚手架：默认关闭；在 giscus.app 生成参数填入 `site-content.json → comments.giscus` 并 `enabled:true` 即启用。
- 清理：`lang=zh-CN`、允许双指缩放、About 文案个人化、删除死代码（`music/list.ts`、`batch-delete-blogs.ts`、`upsertBlogsIndex`）、移除原作者残留（'Suni' 回退、package/wrangler 名称）。

## 📌 使用备忘
- **写文章**：首页「写文章」→ 导入 .pem（Downloads 里有 `kael-odin-blog.*.pem`）→ 编辑器改完即自动存草稿。
- **加音乐**：音频放 `public/music/`，在 `src/config/playlist.json` 加一条。
- **开评论**：见上 giscus 三步。
- **视频**：B站/YouTube 直接贴链接；本地视频≤80MB 从「图片管理」上传。

## 🔜 待办（按价值排序，未实施）
1. **暗色模式全站化**：工程量大（全站浅色主题 + 12 张卡片配色基于 CSS 变量，需成对设计暗色 token + shiki 双主题）。本次只做了基础设施（代码块仍 one-light 单主题）。
2. **移动端编辑**：所有编辑工具栏 `max-sm:hidden`，手机端建议至少开放文章编辑器。
3. **编辑旧图回收**：编辑文章换图后旧图片文件仍留在仓库，可在 push-blog 时对比新旧 md 引用并删除孤儿文件。
4. **`typescript.ignoreBuildErrors` 关闭**：当前 tsc 基线为 0 错误，可以关掉以保住这条基线（本次未动，避免部署风险）。
5. **hidden 的强保护**：内容文件仍以静态资源存在，拿到直链仍可读（架构限制）；若需强保护需改为服务端鉴权 API 出内容。
6. 访问统计：如需可加自托管 umami 或 Vercel Analytics。

## 🔧 运维备忘
- Vercel 环境变量：`NEXT_PUBLIC_GITHUB_APP_ID=3002414`、`GITHUB_APP_PRIVATE_KEY`（.pem 全文）。**改 NEXT_PUBLIC_* 后必须 Redeploy**。
- GitHub 账号旧名 `ordin-thordata`（改名重定向对 raw 有效、对 API 子路径 404）——配置里不要再写旧名。
- 点赞数据在仓库根 `likes.json`，由 Vercel 服务端凭据提交（bot 记录）。
