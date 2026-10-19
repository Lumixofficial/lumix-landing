FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# The landing page is statically rendered, so footer destinations are read
# at build time and must be passed as build args rather than runtime env.
ARG LUMIX_GITHUB_URL=""
ARG LUMIX_X_URL=""
ARG LUMIX_DISCORD_URL=""
ARG LUMIX_TERMS_URL=""
ARG LUMIX_PRIVACY_URL=""
ARG LUMIX_DOCS_URL=""

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# next.config.ts sets distDir to ".next16", so the build output lives there
# and the standalone server expects static assets under ./.next16/static.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next16/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next16/static ./.next16/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
