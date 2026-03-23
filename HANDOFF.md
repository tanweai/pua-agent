# Handoff — PUA Agent (2026-03-23)

## 项目位置
`/Users/xsser/Downloads/claude-agent/`
GitHub: `tanweai/pua-agent`
push: `GIT_SSH_COMMAND="ssh -i ~/.ssh/id_rsa2" git push`

## 技术栈
- 前端: Vite 6 + React 19 + TS + Tailwind (packages/web, :5173)
- 后端: Hono + Agent SDK (packages/server, :3001)
- API: 智谱 GLM via open.bigmodel.cn/api/anthropic
- Agent SDK: @anthropic-ai/claude-agent-sdk@0.2.81
- Auth: bcryptjs + jsonwebtoken (JSON 文件存储)

## 启动
```bash
cd packages/server && npx tsx src/index.ts &
cd packages/web && npx vite --host &
```

## 当前 Auth 系统 — 已完成
- POST /api/auth/register (邀请码+用户名+密码→JWT)
- POST /api/auth/login (用户名+密码→JWT)
- GET /api/auth/me (验证 token)
- Auth 中间件保护 /api/agent/*
- 前端 AuthPage (登录/注册 tab 切换)
- useAuth hook (localStorage token 持久化)
- Sidebar 用户名+登出按钮
- 预设邀请码: PUA2026, AGENT888, TANWEI666, OPENPUA, BETA001
- 数据存储: .data/users.json, .data/invites.json

## 待完成 — 用户系统完善

### 密码找回
1. 忘记密码流程（邀请码验证→重置密码，因为没有邮箱系统）
2. POST /api/auth/reset-password (inviteCode + username + newPassword)
3. 前端"忘记密码？"链接→重置密码表单

### 个人设置页面
4. 设置页面/面板: 修改密码、修改用户名显示名
5. POST /api/auth/change-password (oldPassword + newPassword)
6. 用户头像（可选，字母头像即可）
7. 主题偏好持久化到用户数据
8. API 使用统计（总 cost、总 turns）

### 分享链接
9. 分享对话功能: 生成分享链接 /share/:id
10. POST /api/share/create (conversationId → shareId)
11. GET /api/share/:id (公开访问, 无需登录)
12. 分享页面: 只读对话展示

### 其他常见设置
13. 关于页面（PUA Agent 品牌信息、版本号、官网链接）
14. 删除账号功能
15. 登录记住我（token 过期时间选择）
16. 登录失败次数限制
17. 注册时密码强度提示
18. Session 管理（显示活跃 session, 可踢出）

## 关键架构决策
- systemPrompt 必须用 string (NOT preset)，否则 Claude 身份无法覆盖
- crypto.randomUUID 在 HTTP LAN 不可用 → uuid() fallback
- 图片上传: FileReader.readAsDataURL → POST /api/upload/image → Read 工具
- /pua slash command 在 SDK 中不工作 → systemPrompt 注入
- ESM 环境不能用 require() → 顶部 import

## 品牌
- 名称: PUA Agent, 由北京探微杜渐科技设计
- 官网: https://openpua.ai
- 主色: #e8453c
- Logo: public/pua-logo.svg
