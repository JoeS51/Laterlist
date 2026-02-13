```txt
npm install
npm run dev
```

```txt
npm run deploy
```

## Deploy

Database migrations (D1):

```txt
npx wrangler d1 migrations apply later-list --remote
```

Worker (bun):

```txt
bun run deploy
```

## D1 database migrations

Do not edit existing migration files after they have been applied. Create a new migration and apply it.

Create a new migration:

```txt
npx wrangler d1 migrations create later-list "describe_change"
```

Add SQL (typically `ALTER TABLE` statements) to the new file in `migrations/`.

Apply locally:

```txt
npx wrangler d1 migrations apply later-list --local
```

Apply to production:

```txt
npx wrangler d1 migrations apply later-list
```

If you also changed API code, deploy the Worker (bun):

```txt
bun run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
