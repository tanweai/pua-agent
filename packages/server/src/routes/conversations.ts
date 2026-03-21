import { Hono } from 'hono'

export const conversationsRoute = new Hono()

// In-memory store (for demo; production would use a database)
const conversations = new Map<string, {
  id: string
  title: string
  messages: Array<{ role: string; content: string }>
  createdAt: number
  updatedAt: number
}>()

conversationsRoute.get('/conversations', (c) => {
  const list = Array.from(conversations.values())
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }))
  return c.json(list)
})

conversationsRoute.get('/conversations/:id', (c) => {
  const conv = conversations.get(c.req.param('id'))
  if (!conv) return c.json({ error: 'Not found' }, 404)
  return c.json(conv)
})

conversationsRoute.post('/conversations', async (c) => {
  const body = await c.req.json<{ title?: string }>()
  const id = crypto.randomUUID()
  const now = Date.now()
  const conv = {
    id,
    title: body.title || 'New Conversation',
    messages: [],
    createdAt: now,
    updatedAt: now,
  }
  conversations.set(id, conv)
  return c.json(conv, 201)
})

conversationsRoute.put('/conversations/:id', async (c) => {
  const conv = conversations.get(c.req.param('id'))
  if (!conv) return c.json({ error: 'Not found' }, 404)
  const body = await c.req.json()
  if (body.title) conv.title = body.title
  if (body.messages) conv.messages = body.messages
  conv.updatedAt = Date.now()
  return c.json(conv)
})

conversationsRoute.delete('/conversations/:id', (c) => {
  conversations.delete(c.req.param('id'))
  return c.json({ ok: true })
})
