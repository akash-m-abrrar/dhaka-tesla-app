# Local Docker stack

The Compose stack runs PostgreSQL, applies the existing Prisma migrations, then starts the API in watch mode. PostgreSQL data is kept in the `postgres_data` named volume. The API health check calls `/api/v1/health`, which runs `SELECT 1` against PostgreSQL.

## Configure and start

From `backend/`:

```powershell
if (!(Test-Path .env.docker)) { Copy-Item .env.docker.example .env.docker }
```

Edit `.env.docker` and ensure it contains all entries from `.env.docker.example`. Replace the example database password and both JWT secrets with local-only values. If `.env.docker` already exists, merge the missing entries without replacing the database credentials. Keep `DATABASE_URL` pointed at host `postgres`; that is the Compose service name. Use a URL-safe database password, or percent-encode special characters in `DATABASE_URL`.

Start the stack:

```powershell
docker compose up --build -d
docker compose ps
```

The `migrate` service runs `prisma migrate deploy` after PostgreSQL is healthy. The API waits for both database health and successful migration completion. The development API watches the mounted `src/` directory; rebuild after changing dependencies, Prisma schema/configuration, or the Dockerfile.

## Common commands

```powershell
# Follow all service logs
docker compose logs -f

# Follow API logs only
docker compose logs -f backend

# Stop and remove containers; preserve PostgreSQL data
docker compose down

# Apply pending migrations to the running database
docker compose run --rm migrate pnpm exec prisma migrate deploy

# Run the configured Prisma seed workflow
docker compose run --rm migrate pnpm exec prisma db seed

# Rebuild images and restart the stack
docker compose up --build -d

# Build the production API image
docker build --target production -t tesla-bullet-backend:local .
```

The production image uses the existing `node dist/server.js` start mechanism, runs as a non-root user, and contains production dependencies only. The local Compose API uses the development target with `pnpm dev`.
