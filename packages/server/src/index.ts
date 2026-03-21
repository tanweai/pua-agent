import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import 'dotenv/config'
import { chatRoute } from './routes/chat.js'
import { conversationsRoute } from './routes/conversations.js'
import { uploadRoute } from './routes/upload.js'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: 'http://localhost:5173' }))

app.route('/api', chatRoute)
app.route('/api', conversationsRoute)
app.route('/api', uploadRoute)

app.get('/health', (c) => c.json({ status: 'ok' }))

const port = Number(process.env.PORT) || 3001
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
