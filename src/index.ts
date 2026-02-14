import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'

type Env = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: ['http://localhost:4321', 'https://joe-list.vercel.app'],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
)


const links: string[] = [];

const CreateLinkSchema = z.object({
  url: z.string().url(),
  title: z.string()
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

app.post('/link', async (c) => {
  const raw = await c.req.json()
  const parsed = CreateLinkSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400);
  }

  await c.env.DB.prepare(
    `INSERT INTO links (id, url, title, created_at)
     VALUES (?, ?, ?, ?)`
  )
    .bind(crypto.randomUUID(), parsed.data.url, parsed.data.title, Date.now())
    .run()

  return c.text("created", 201)
});

app.delete('/link/:id', async (c) => {
  const id = c.req.param('id');

  const result = await c.env.DB
    .prepare(`DELETE FROM links where id = ?`)
    .bind(id)
    .run()

  return c.text('deleted', 200)
})

app.get('/links', async (c) => {
  const result = await c.env.DB
    .prepare(`SELECT id, URL, title, created_at FROM links ORDER BY created_at DESC`)
    .all()

  return c.json(result.results)
});

app.get('/*', (c) => {
  return c.text('Invalid endpoint', 404)
})

export default app;
