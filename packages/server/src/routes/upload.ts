import { Hono } from 'hono'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export const uploadRoute = new Hono()

const UPLOAD_DIR = join(process.cwd(), '.uploads')

uploadRoute.post('/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }

  const buffer = await file.arrayBuffer()
  const text = new TextDecoder().decode(buffer)

  return c.json({
    name: file.name,
    size: file.size,
    type: file.type,
    content: text,
  })
})

// Image upload: receives base64 data URL, saves to disk, returns path
uploadRoute.post('/upload/image', async (c) => {
  const body = await c.req.json<{ name: string; type: string; data: string }>()

  if (!body.data || !body.name) {
    return c.json({ error: 'Missing image data' }, 400)
  }

  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true })
  }

  // Extract base64 from data URL
  const base64Match = body.data.match(/^data:[^;]+;base64,(.+)$/)
  if (!base64Match) {
    return c.json({ error: 'Invalid data URL format' }, 400)
  }

  const buffer = Buffer.from(base64Match[1], 'base64')
  const safeName = body.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileName = `${Date.now()}-${safeName}`
  const filePath = join(UPLOAD_DIR, fileName)

  writeFileSync(filePath, buffer)
  console.log(`[Upload] Image saved: ${filePath} (${buffer.length} bytes)`)

  return c.json({ path: filePath, name: fileName, size: buffer.length })
})
