# Tesla Bullet frontend

The public Tesla Bullet homepage is built with Next.js App Router, TypeScript,
Tailwind CSS, and shadcn/ui.

## Development

Install dependencies with pnpm, then start the development server:

```sh
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` to override the API base URL. The current
value points to the production API; no endpoint methods are implemented yet.

## Checks

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```
