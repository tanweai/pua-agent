import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export const authRoute = new Hono()

const JWT_SECRET = process.env.JWT_SECRET || 'pua-agent-secret-key-2026'
const DATA_FILE = join(process.cwd(), '.data', 'users.json')
const INVITE_FILE = join(process.cwd(), '.data', 'invites.json')

// --- Data helpers ---

interface User {
  username: string
  passwordHash: string
  createdAt: string
  inviteCode: string
}

interface InviteCode {
  code: string
  used: boolean
  usedBy?: string
  createdAt: string
}

function ensureDataDir() {
  const dir = join(process.cwd(), '.data')
  if (!existsSync(dir)) {
    const { mkdirSync } = require('fs')
    mkdirSync(dir, { recursive: true })
  }
}

function loadUsers(): User[] {
  ensureDataDir()
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, '[]')
    return []
  }
  return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
}

function saveUsers(users: User[]) {
  ensureDataDir()
  writeFileSync(DATA_FILE, JSON.stringify(users, null, 2))
}

function loadInvites(): InviteCode[] {
  ensureDataDir()
  if (!existsSync(INVITE_FILE)) {
    // Seed with default invite codes
    const defaults: InviteCode[] = [
      { code: 'PUA2026', used: false, createdAt: new Date().toISOString() },
      { code: 'AGENT888', used: false, createdAt: new Date().toISOString() },
      { code: 'TANWEI666', used: false, createdAt: new Date().toISOString() },
      { code: 'OPENPUA', used: false, createdAt: new Date().toISOString() },
      { code: 'BETA001', used: false, createdAt: new Date().toISOString() },
    ]
    writeFileSync(INVITE_FILE, JSON.stringify(defaults, null, 2))
    return defaults
  }
  return JSON.parse(readFileSync(INVITE_FILE, 'utf-8'))
}

function saveInvites(invites: InviteCode[]) {
  ensureDataDir()
  writeFileSync(INVITE_FILE, JSON.stringify(invites, null, 2))
}

// --- Routes ---

// Register
authRoute.post('/auth/register', async (c) => {
  const { username, password, inviteCode } = await c.req.json<{
    username: string
    password: string
    inviteCode: string
  }>()

  if (!username || !password || !inviteCode) {
    return c.json({ error: '请填写所有字段' }, 400)
  }

  if (username.length < 2 || username.length > 20) {
    return c.json({ error: '用户名需要 2-20 个字符' }, 400)
  }

  if (password.length < 6) {
    return c.json({ error: '密码至少 6 个字符' }, 400)
  }

  // Check invite code
  const invites = loadInvites()
  const invite = invites.find(i => i.code === inviteCode && !i.used)
  if (!invite) {
    return c.json({ error: '邀请码无效或已被使用' }, 400)
  }

  // Check username uniqueness
  const users = loadUsers()
  if (users.some(u => u.username === username)) {
    return c.json({ error: '用户名已存在' }, 400)
  }

  // Create user
  const passwordHash = await bcrypt.hash(password, 10)
  const newUser: User = {
    username,
    passwordHash,
    createdAt: new Date().toISOString(),
    inviteCode,
  }
  users.push(newUser)
  saveUsers(users)

  // Mark invite as used
  invite.used = true
  invite.usedBy = username
  saveInvites(invites)

  // Generate JWT
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' })

  console.log(`[Auth] Registered: ${username} (invite: ${inviteCode})`)
  return c.json({ token, username })
})

// Login
authRoute.post('/auth/login', async (c) => {
  const { username, password } = await c.req.json<{
    username: string
    password: string
  }>()

  if (!username || !password) {
    return c.json({ error: '请填写用户名和密码' }, 400)
  }

  const users = loadUsers()
  const user = users.find(u => u.username === username)
  if (!user) {
    return c.json({ error: '用户名或密码错误' }, 400)
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: '用户名或密码错误' }, 400)
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' })

  console.log(`[Auth] Login: ${username}`)
  return c.json({ token, username })
})

// Verify token (for frontend to check if token is still valid)
authRoute.get('/auth/me', async (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { username: string }
    return c.json({ username: payload.username })
  } catch {
    return c.json({ error: 'Token expired' }, 401)
  }
})

// --- Auth middleware export ---
export function verifyToken(token: string): { username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string }
  } catch {
    return null
  }
}
