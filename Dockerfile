FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# package-lock was generated on macOS, so linux optional native binaries for
# Tailwind/lightningcss are missing — install them explicitly for Cloud Build.
RUN npm ci \
  && npm install --no-save lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Standalone output copies only the files needed to run `node server.js`.
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Cloud Run injects PORT; Next's standalone server.js respects it.
ENV PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
