import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono()

const links: string[] = [];

app.get('/', (c) => {
  return c.text('Hello Hono!')
});

app.post('/link', (c) => {
  links.push("link1");
  return c.text("created", 201)
});

app.get('/links', (c) => {
  return c.json({
    links
  })
});

export default app
