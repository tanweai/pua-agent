import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { networkInterfaces } from 'os'
import 'dotenv/config'
import { chatRoute } from './routes/chat.js'
import { conversationsRoute } from './routes/conversations.js'
import { uploadRoute } from './routes/upload.js'
import { agentRoute } from './routes/agent.js'

function getLocalIP(): string {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return '127.0.0.1'
}

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: '*' }))

app.route('/api', chatRoute)
app.route('/api', agentRoute)
app.route('/api', conversationsRoute)
app.route('/api', uploadRoute)

app.get('/health', (c) => c.json({ status: 'ok' }))

// Connection info for QR code
app.get('/api/connect', (c) => {
  const ip = getLocalIP()
  const fePort = 5173
  const url = `http://${ip}:${fePort}`
  return c.json({ url, ip, port: fePort })
})

const port = Number(process.env.PORT) || 3001
const localIP = getLocalIP()
console.log(`Server running on http://localhost:${port}`)
console.log(`LAN access: http://${localIP}:${port}`)
serve({ fetch: app.fetch, port })
