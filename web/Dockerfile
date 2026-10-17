FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dev.db ./dev.db

RUN mkdir -p /app/data

EXPOSE 3000 10000
CMD ["sh", "-c", "if [ ! -f /app/data/aura.db ] && [ -f /app/dev.db ]; then cp /app/dev.db /app/data/aura.db; fi; HOSTNAME=0.0.0.0 PORT=${PORT:-3000} node server.js"]