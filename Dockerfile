# syntax=docker/dockerfile:1
# Najdi si školu — TTSK
# Next.js 16 (App Router) + Prisma 7 (prisma-client generator + adapter-pg)
# Celý stack je čistý JavaScript → funguje na alpine aj amd64/arm64 bez kompilácie.

FROM node:22-alpine AS base
WORKDIR /app

# ---------- 1) Dependencies ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 2) Build (prisma generate + next build) ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# prisma generate nepotrebuje skutočnú DB, ale config (prisma7.config.ts) číta
# DATABASE_URL z env. Dummy URL zabráni "env not found" počas generovania klienta.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
RUN npm run build

# ---------- 3) Runner ----------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Celý node_modules sa kopíruje zámerne: Next 16 + Prisma 7 klient (query compiler
# ako base64-wasm v .mjs) sú čistý JS, takže žiadne natívne binárky nechýbajú
# a prisma CLI ostáva dostupné pre `prisma migrate deploy` po nasadení.
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=build --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=build --chown=nextjs:nodejs /app/prisma7.config.ts ./prisma7.config.ts
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/src ./src
COPY --from=build --chown=nextjs:nodejs /app/.next ./.next
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start"]
