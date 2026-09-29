FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

WORKDIR /app

RUN corepack enable \
    && corepack prepare pnpm@10.14.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS development

COPY . .
RUN DATABASE_URL=postgresql://postgres:build-only@127.0.0.1:5432/build_only pnpm exec prisma generate

EXPOSE 5000
CMD ["pnpm", "dev"]

FROM base AS builder

COPY . .
RUN DATABASE_URL=postgresql://postgres:build-only@127.0.0.1:5432/build_only pnpm exec prisma generate \
    && pnpm run build

FROM builder AS migrator

CMD ["pnpm", "exec", "prisma", "migrate", "deploy"]

FROM builder AS production-dependencies

RUN pnpm prune --prod

FROM node:22-alpine AS production

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5000

WORKDIR /app

RUN addgroup -S app \
    && adduser -S app -G app

COPY --from=production-dependencies --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --chown=app:app package.json ./package.json

USER app
EXPOSE 5000
CMD ["node", "dist/server.js"]
