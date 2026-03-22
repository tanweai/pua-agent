# Handoff — PUA Agent 前端项目

## 项目位置
`/Users/xsser/Downloads/claude-agent/`
GitHub: `tanweai/pua-agent`

## 技术栈
- **前端**: Vite 6 + React 19 + TypeScript + Tailwind CSS (packages/web, port 5173)
- **后端**: Hono + Agent SDK (packages/server, port 3001)
- **API**: 智谱 GLM via `open.bigmodel.cn/api/anthropic`
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk@0.2.81`, `includePartialMessages: true`

## 当前状态 — Phase 1 + Phase 2 已完成功能

### Phase 1 (Core)
- 完整 SSE 状态机 (useReducer)
- ThinkingBlock (折叠/展开, Show more, CSS Grid 动画)
- SearchCard (WebSearch 结果, 展开/收起, favicon+title+domain)
- 多轮 Agent SDK session resume
- 内联引用 [SourceName] → CitationChip + hover popover
- Sources 底部列表自动清除 (多模式 regex)
- SubagentCard (Agent/Task 工具调用显示)
- Skill/Read/Bash/Glob/Grep 紧凑显示
- 暗色模式, 空状态, ScrollToBottom, Toast, 键盘快捷键
- Artifacts 面板 (Preview/Code tabs)
- 文件拖拽上传, FileChip
- system-reminder #e8453c 红色卡片显示

### Phase 2 (Agent Capabilities)
- **task_progress 事件转发** — 后端检测 system/task_started|task_progress|task_notification 并转发 SSE
- **TaskProgressBar** — SubagentCard 内实时进度条 + tool_use_count + duration + AI summary
- **Team Panel** — 当 2+ agent blocks 存在时，显示聚合看板（状态/进度/摘要）
- **Skills UI** — 输入框上方快捷 skill chips (Web Search/Analyze File/Run Command/Subagent)
  - 后端 GET /api/agent/tools 返回可用工具列表
  - 点击展开显示全部工具
- **Agent 定义 UI** — Sidebar 底部 Custom Agents 面板
  - 添加/编辑/删除/启用禁用自定义 agent
  - name/description/prompt/tools 配置
  - localStorage 持久化
  - 自动转换为 Agent SDK `agents` 参数格式
- **正文内联引用强化** — 更多 strip 模式 (References/参考资料/出处/编号列表)
  - MarkdownRenderer fuzzy 匹配增强（title words, domain without TLD）
- **agentProgressSummaries** — 后端开启 AI 生成的进度摘要
- **allowedTools** 扩展 — 新增 Agent + Skill 工具

## Phase 3 待完成
1. **Visualizer Widget** — 已有 WidgetRenderer 组件, 需要模型实际调用 visualize:show_widget
2. **Agent Team Live Dashboard** — 独立侧面板实时看板（vs 当前 inline TeamPanel）
3. **Session History UI** — 利用 Agent SDK listSessions/getSessionMessages API
4. **Settings Panel** — 独立设置页面（模型选择、API 配置、主题等）

## 关键架构决策
- Agent 模式: 多 turn 的 message_start/stop 合并为一条消息 (agentBlockOffset 追踪)
- Agent 子进程 env 必须包含 `...process.env` (PATH 不能丢)
- CLI path 通过 `realpathSync` 解析 pnpm symlink
- settingSources 不能用 (hooks 冲突导致 exit 1)
- taskProgress 以 `Record<string, TaskProgress>` 存储, key = tool_use_id
- Team Panel 聚合所有 Agent/Task tool_use blocks, 当 ≥2 时自动显示
- Custom agents 通过 localStorage 持久化, 转换为 SDK agents 参数

## 启动命令
```bash
cd packages/server && npx tsx src/index.ts &
cd packages/web && npx vite --host &
```

## Git
push 用: `GIT_SSH_COMMAND="ssh -i ~/.ssh/id_rsa2" git push`
