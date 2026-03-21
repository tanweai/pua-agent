import { Hono } from 'hono'

export const uploadRoute = new Hono()

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
