import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { basicAuth } from 'hono/basic-auth'
import { z } from 'zod'

type Env = {
  DB: D1Database
  ADMIN_USER: string
  ADMIN_PASSWORD: string
}

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:4321',
      'https://joe-list.vercel.app',
      'https://library.joesluis.dev',
    ],
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

type CategoryRow = {
  id: string,
  name: string
}

type PaperRow = {
  id: string
  url: string
  title: string
  created_at: number
  category_name: string | null
}

type PaperResponse = {
  id: string
  url: string
  title: string
  created_at: number
  categories: string[]
}

const links: string[] = [];

const CreateLinkSchema = z.object({
  url: z.string().url(),
  title: z.string()
})

const CreatePaperSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  category: z.array(z.string()).min(1)
})

const CreatePodcastSchema = z.object({
  url: z.string().url(),
  title: z.string()
})

const adminAuth = basicAuth({
  verifyUser: (username, password, c) => {
    return username === c.env.ADMIN_USER && password === c.env.ADMIN_PASSWORD
  },
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

app.post('/link', adminAuth, async (c) => {
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

app.post('/to-read', adminAuth, async (c) => {
  // todo
});

app.post('/paper', adminAuth, async (c) => {
  const raw = await c.req.json();
  const parsed = CreatePaperSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400);
  }
  console.log(parsed);

  const paper_id = crypto.randomUUID();
  const category_ids = [];

  for (const category of parsed.data.category) {
    const curr_category = category.toLowerCase();
    const result = await c.env.DB
      .prepare(`SELECT id, name FROM categories WHERE name = ?`)
      .bind(curr_category)
      .first<CategoryRow>();

    console.log("Result of categories sql query")
    console.log(result)

    // No existing category so insert into DB
    if (!result) {
      const category_id = crypto.randomUUID();

      await c.env.DB.prepare(
        `INSERT INTO categories (id, name)
            VALUES (?, ?)`
      )
        .bind(category_id, curr_category)
        .run();

      category_ids.push(category_id);
    } else {
      category_ids.push(result.id)
    }
  }

  await c.env.DB.prepare(
    `INSERT INTO papers (id, url, title, created_at)
            VALUES (?, ?, ?, ?)`
  )
    .bind(paper_id, parsed.data.url, parsed.data.title, Date.now())
    .run();

  for (const category_id of category_ids) {

    await c.env.DB.prepare(
      `INSERT INTO paper_categories (paper_id, category_id)
            VALUES (?, ?)`
    )
      .bind(paper_id, category_id)
      .run();
  }

  return c.text("created", 201)
});

app.post('/podcast', adminAuth, async (c) => {
  const raw = await c.req.json()
  const parsed = CreatePodcastSchema.safeParse(raw)
  if (!parsed.success) {
    return c.json({ error: parsed.error }, 400)
  }

  await c.env.DB.prepare(
    `INSERT INTO podcasts (id, url, title, created_at)
     VALUES (?, ?, ?, ?)`
  )
    .bind(crypto.randomUUID(), parsed.data.url, parsed.data.title, Date.now())
    .run()

  return c.text('created', 201)
});

app.delete('/link/:id', adminAuth, async (c) => {
  const id = c.req.param('id');

  const result = await c.env.DB
    .prepare(`DELETE FROM links where id = ?`)
    .bind(id)
    .run()

  return c.text('deleted', 200)
});

app.delete('/paper/:id', adminAuth, async (c) => {
  const id = c.req.param('id');

  await c.env.DB
    .prepare(`DELETE FROM papers where id = ?`)
    .bind(id)
    .run()

  return c.text('deleted', 200)
});

app.delete('/podcast/:id', adminAuth, async (c) => {
  const id = c.req.param('id')

  await c.env.DB
    .prepare(`DELETE FROM podcasts WHERE id = ?`)
    .bind(id)
    .run()

  return c.text('deleted', 200)
});

app.get('/links', async (c) => {
  const result = await c.env.DB
    .prepare(`SELECT id, URL, title, created_at FROM links ORDER BY created_at DESC`)
    .all()

  return c.json(result.results)
});

app.get('/papers', async (c) => {
  const result = await c.env.DB
    .prepare(`SELECT p.id, p.url, p.title, p.created_at, c.name AS category_name
              FROM papers AS p
              LEFT JOIN paper_categories AS pc ON p.id = pc.paper_id
              LEFT JOIN categories AS c on pc.category_id = c.id
              ORDER BY p.created_at DESC
    `)
    .all<PaperRow>()

  const papersById = new Map<string, PaperResponse>();
  for (const row of result.results) {
    if (!papersById.has(row.id)) {
      papersById.set(row.id, {
        id: row.id,
        url: row.url,
        title: row.title,
        created_at: row.created_at,
        categories: [],
      })
    }
    if (row.category_name) {
      papersById.get(row.id)!.categories.push(row.category_name)
    }
  }

  const papers = Array.from(papersById.values())
  return c.json(papers)
});

app.get('/podcasts', async (c) => {
  const result = await c.env.DB
    .prepare(`SELECT id, url, title, created_at FROM podcasts ORDER BY created_at DESC`)
    .all()

  return c.json(result.results)
});

app.get('/papercount', async (c) => {
  const result = await c.env.DB
    .prepare(`SELECT COUNT(*) as count FROM papers`)
    .first();

  return c.json(result)
});

app.get('/admin/check', adminAuth, (c) => {
  return c.text('ok', 200)
})

app.get('/*', (c) => {
  return c.text('Invalid endpoint', 404)
})

export default app;
