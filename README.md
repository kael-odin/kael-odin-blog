## Kael Blog 2026

**ZH | 简介**

Kael 的个人博客与数字花园，基于 Next.js 2025 app router 搭建，支持通过 GitHub App 在网页前端可视化编辑内容（文章、站点配置、图片等），所有内容最终都落在我的 GitHub 仓库中，便于长期维护和备份。

**EN | Overview**

Kael's personal blog & digital garden, built with Next.js app router.  
Content (posts, site config, images, etc.) is managed visually in the browser via a GitHub App and persisted back to this GitHub repository.

> Template inspired by [`YYsuni/2025-blog-public`](https://github.com/YYsuni/2025-blog-public) and adapted for my own use.

---

## 特性 Features

- **前端可视化内容管理 Visual content editing**
  - 在浏览器中写 Markdown 文章、上传封面和插图
  - 通过 GitHub App 自动提交到仓库（无需单独登录后台）
- **完全由 Git 仓库驱动 Git-based content**
  - 文章保存在 `public/blogs/*`，支持版本管理和回滚
  - 站点配置与布局保存在 `src/config/*`
- **现代前端技术栈 Modern stack**
  - Next.js 16、React 19、TypeScript、Tailwind CSS 4
  - 动效和交互细节友好，适配桌面与移动端
- **多入口内容模块 Multiple sections**
  - 博客文章、项目展示、图片墙、分享区、代码片段等

---

## 在线地址 Online Demo

- **Production**: `https://kael-odin-blog.vercel.app/`

---

## 技术栈 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **UI & Styles**: React 19, Tailwind CSS 4, custom CSS
- **Content**: Markdown + JSON (blog index, categories, site config)
- **Auth & GitHub Integration**:
  - GitHub App + Private Key (PEM)
  - GitHub REST API for commits / blobs / trees
- **Deployment**: Vercel / Cloudflare (via `@opennextjs/cloudflare`)

---

## 本地开发 Local Development

**前置要求 Prerequisites**

- Node.js（建议 LTS 版本）
- 包管理工具：推荐 `pnpm`

```bash
pnpm install
pnpm dev
```

默认开发端口为 `http://localhost:2025`。

**构建与启动 Build & Start**

```bash
pnpm build
pnpm start
```

---

## 内容结构与可视化编辑 Content Structure & Visual Editing

### 文章与索引 Blogs & Index

- 单篇文章目录结构 Single post structure
  - `public/blogs/{slug}/index.md`：正文内容（Markdown）
  - `public/blogs/{slug}/config.json`：文章元信息（标题、标签、封面、摘要等）
- 文章列表与分类 Index & Categories
  - `public/blogs/index.json`：全部文章的索引
  - `public/blogs/categories.json`：分类配置

你可以：

- **直接修改文件**（适合批量重构或迁移）
- 或者在前端进入 `/blog`、`/write` 页面，通过 UI 编辑并点击保存/发布，由前端自动写回 GitHub 仓库。

### 站点配置 Site Configuration

- 全局站点信息、主题色和社交链接在：
  - `src/config/site-content.json`
- 首页卡片布局配置在：
  - `src/config/card-styles.json`
- 首页逻辑入口在：
  - `src/app/(home)/page.tsx`

这些配置既可以手改文件，也可以在首页的配置入口里可视化调整后保存（通过 GitHub App 推送回仓库）。

---

## 使用 GitHub App 进行前端编辑 Using GitHub App for Editing

该项目通过 GitHub App + Private Key 的方式在前端生成 Installation Token，并直接调用 GitHub API 提交变更。

### 1. 创建 GitHub App

在 GitHub 个人账号下创建一个新的 GitHub App（**不是 OAuth App**）：

1. 打开 `Settings -> Developer settings -> GitHub Apps`
2. 点击 **New GitHub App**
3. 填写名称、Homepage 随意；Webhook 可以关闭
4. **Permissions**：
   - `Repository permissions -> Contents`：**Read and write**
   - 其余权限保持默认即可
5. 保存后，在该 App 页点击 **Generate a private key**，下载得到 `.pem` 文件
6. 记下 **App ID**

然后在 App 的 **Install App** 页面：

1. 选择 **Only select repositories**
2. 只勾选本仓库（例：`ordin-thordata/kael-odin-blog`）

### 2. 配置环境变量 Environment Variables

在部署平台（如 Vercel）中配置以下环境变量：

```bash
NEXT_PUBLIC_GITHUB_OWNER=ordin-thordata
NEXT_PUBLIC_GITHUB_REPO=kael-odin-blog
NEXT_PUBLIC_GITHUB_BRANCH=main
NEXT_PUBLIC_GITHUB_APP_ID=<你的 GitHub App ID>
NEXT_PUBLIC_GITHUB_ENCRYPT_KEY=<任意一串较长的加密密钥>
```

> `NEXT_PUBLIC_GITHUB_ENCRYPT_KEY` 用于在浏览器中加密缓存 `.pem`，请自行设置为一串足够随机的字符串。

### 3. 在前端导入 Private Key

1. 打开线上站点，例如 `https://你的-vercel-域名`
2. 进入写作页 `/write` 或文章列表页 `/blog`、站点配置入口等
3. 页面中会有“导入密钥”或上传 `.pem` 文件的按钮
4. 选择你刚才下载的 `.pem`，导入后即可在前端执行：
   - 发布/更新文章
   - 更新站点配置
   - 更新项目、图片、分享等内容

---

## 部署到 Vercel Deploy to Vercel

以 Vercel 为例的部署流程：

1. 将本仓库推送到 GitHub（例如 `ordin-thordata/kael-odin-blog`）
2. 登录 Vercel，点击 **Add New -> Project**
3. 在 GitHub 仓库列表中选择本项目，点击 **Import**
4. 保持构建配置为 Next.js 默认即可（Framework: Next.js）
5. 在 **Environment Variables** 中添加上一节提到的几项环境变量
6. 点击 **Deploy**，等待构建完成，即可获得一个 `*.vercel.app` 域名

之后每次向 `main` 分支推送代码，Vercel 会自动触发新的构建和部署。

---

## 与上游模板同步 Updating from Upstream Template

本仓库不是通过 fork 创建，因此同步上游更新可以按下面方式操作：

1. 添加上游远程：

```bash
git remote add upstream https://github.com/YYsuni/2025-blog-public.git
```

2. 拉取上游最新代码：

```bash
git fetch upstream
```

3. 将上游 `main` 合并到当前分支（或基于它 rebase）：

```bash
git merge upstream/main
# 或者：
# git rebase upstream/main
```

4. 解决可能的冲突，确认无误后再推送到你自己的远程：

```bash
git push origin main
```

建议在单独的分支上测试合并效果，再合入 `main`。

---

## 致谢 Acknowledgements

- 原始开源模板：[`YYsuni/2025-blog-public`](https://github.com/YYsuni/2025-blog-public)
- GitHub App 管理内容的设计思路参考了作者在 README 和博客中的介绍。

本仓库在此基础上做了定制化配置与内容结构调整，以适配我的个人使用场景。
