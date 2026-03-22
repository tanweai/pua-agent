# Handoff — PUA Agent 前端项目

## 项目位置
`/Users/xsser/Downloads/claude-agent/`
GitHub: `tanweai/pua-agent`

## 技术栈
- **前端**: Vite 6 + React 19 + TypeScript + Tailwind CSS (packages/web, port 5173)
- **后端**: Hono + Agent SDK (packages/server, port 3001)
- **API**: 智谱 GLM via `open.bigmodel.cn/api/anthropic`
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk@0.2.81`, `includePartialMessages: true`

## 当前状态 — 已完成功能
- 完整 SSE 状态机 (useReducer)
- ThinkingBlock (折叠/展开, Show more, CSS Grid 动画)
- SearchCard (WebSearch 结果, 展开/收起, favicon+title+domain)
- 多轮 Agent SDK session resume
- 内联引用 [SourceName] → CitationChip + hover popover
- Sources 底部列表自动清除
- SubagentCard (Agent/Task 工具调用显示)
- Skill/Read/Bash/Glob/Grep 紧凑显示
- 暗色模式, 空状态, ScrollToBottom, Toast, 键盘快捷键
- Artifacts 面板 (Preview/Code tabs)
- 文件拖拽上传, FileChip
- system-reminder #e8453c 红色卡片显示

## Phase 2 待完成
1. **Team Panel** — 并行子Agent看板, 实时显示各Agent进度
2. **task_progress** — 转发 Agent SDK 的 task_progress 事件, 前端显示进度条
3. **Skills UI** — 前端列出可用 skills, 让用户点击调用
4. **Agent 定义 UI** — 前端可配置子Agent (name, description, tools)
5. **正文内联引用完善** — 模型有时仍输出 Sources 列表, 需要更强的 strip 逻辑
6. **Visualizer Widget** — 已有 WidgetRenderer 组件, 需要模型实际调用 visualize:show_widget

## 关键架构决策
- Agent 模式: 多 turn 的 message_start/stop 合并为一条消息 (agentBlockOffset 追踪)
- Agent 子进程 env 必须包含 `...process.env` (PATH 不能丢)
- CLI path 通过 `realpathSync` 解析 pnpm symlink
- settingSources 不能用 (hooks 冲突导致 exit 1)

## 启动命令
```bash
cd packages/server && npx tsx src/index.ts &
cd packages/web && npx vite --host &
```

## Git
push 用: `GIT_SSH_COMMAND="ssh -i ~/.ssh/id_rsa2" git push`
