# Handoff — PUA Agent 前端项目 (2026-03-23)

## 项目位置
`/Users/xsser/Downloads/claude-agent/`
GitHub: `tanweai/pua-agent`

## 技术栈
- **前端**: Vite 6 + React 19 + TypeScript + Tailwind CSS (packages/web, port 5173)
- **后端**: Hono + Agent SDK (packages/server, port 3001)
- **API**: 智谱 GLM via `open.bigmodel.cn/api/anthropic`
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk@0.2.81`, `includePartialMessages: true`

## 当前状态 — 全部已完成功能

### Phase 1 (Core)
- SSE 状态机 (useReducer) + ThinkingBlock + SearchCard + CitationChip
- 多轮 Agent SDK session resume
- SubagentCard + Skill/Read/Bash/Glob/Grep 工具卡片
- 暗色模式, 空状态, ScrollToBottom, Toast, 键盘快捷键
- Artifacts 面板 + 文件拖拽上传 + system-reminder 红色卡片

### Phase 2 (Agent Capabilities)
- task_progress/task_notification 事件转发 + SubagentCard 进度条
- TeamPanel 聚合看板 (2+ agent blocks)
- Agent 定义 UI (Sidebar Custom Agents, localStorage 持久化)

### Phase 3 (SDK Gap Closure)
- 13 个工具专属 UI 卡片: TaskCard, AskUserCard, TeamCard, FileEditCard, SkillCard, BashCard, ReadCard + 原有的 SearchCard, FetchCard, SubagentCard, CodeExecCard, WidgetRenderer
- Agent Result Badge (cost/usage/turns)
- rate_limit 事件 Toast

### Phase 4 (PUA Mode + UX)
- PUA Mode: P7/P9/P10 Agent Team 注入 Agent SDK
- claude.ai 风格居中首页 (问候语+居中输入框+快捷分类+下拉菜单)
- 第一次发消息后切换到消息列表+底部输入框布局
- PUA 按钮在输入框工具栏 (🔥 PUA on/off)
- 图片上传→保存→路径传 prompt→Agent Read 识别
- QR 扫码连接 (二维码弹窗, 局域网 IP)
- crypto.randomUUID fallback (手机 HTTP 访问兼容)
- PUA Agent 身份: 北京探微杜渐科技, openpua.ai
- 主色 #e8453c, Spinner 双层圆环动画

## 待开发 — 邀请码+注册登录系统

### 后端
1. **数据存储**: 用 JSON 文件或 SQLite 存储用户表 (invite_code, username, password_hash, token, created_at)
2. **POST /api/auth/register**: 验证邀请码→创建用户→返回 JWT
3. **POST /api/auth/login**: 验证用户名密码→返回 JWT
4. **Auth 中间件**: 保护 /api/agent/stream 等端点, 验证 Bearer token
5. **邀请码管理**: 预设邀请码列表, 可选: GET /api/auth/invite-codes (admin)

### 前端
6. **AuthPage 组件**: 登录/注册切换, 邀请码输入框(注册时), 用户名/密码
7. **Auth Context**: React Context + localStorage token 持久化
8. **路由守卫**: 无 token → 跳转 AuthPage, 有 token → 进入 ChatView
9. **Header 用户信息**: 显示用户名, 登出按钮
10. **useSSEStream**: 请求头加 Authorization: Bearer <token>

### 设计要点
- 邀请码一次性使用 (used=true 后不可再用)
- JWT 包含 username + exp, 有效期 7 天
- 密码用 bcrypt hash (或简单 SHA-256 for MVP)
- 登录页面保持 PUA Agent 品牌风格 (#e8453c 主色, PUA logo)

## 关键架构决策
- Agent SDK systemPrompt 必须用 string 类型 (NOT preset) 才能控制身份
- preset 'claude_code' 硬编码 "You are Claude" 无法被 append 覆盖
- /pua slash command 在 Agent SDK 中不工作 (SDK 没有完整 CLI 运行时)
- 图片上传: FileReader.readAsDataURL → POST /api/upload/image → 路径追加到 prompt → Agent Read
- crypto.randomUUID 只在 Secure Context 可用, 手机 HTTP 访问需要 fallback

## 踩坑记录
- `crypto.randomUUID()` 在 `http://192.168.x.x` 不可用 → uuid() fallback
- `/pua` prompt 前缀导致 Agent SDK 静默完成 cost=0 → 去掉前缀, 用 systemPrompt 注入
- preset systemPrompt 的 append 无法覆盖 Claude 身份 → 改用 string 类型
- 图片 f.text() 返回二进制乱码导致白屏 → FileReader.readAsDataURL
- tool_result `{"results":[]}` 显示在卡片里 → 过滤空结果

## 启动命令
```bash
cd packages/server && npx tsx src/index.ts &
cd packages/web && npx vite --host &
```

## Git
push 用: `GIT_SSH_COMMAND="ssh -i ~/.ssh/id_rsa2" git push`
