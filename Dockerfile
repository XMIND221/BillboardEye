# ─── Étape 1 : build Next (tmp_v0_template) pour PDF identique à l’UI ───
FROM node:20-bookworm-slim AS report-ui

WORKDIR /build

COPY tmp_v0_template/package.json ./
RUN npm install --no-audit --no-fund

COPY tmp_v0_template/ ./

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build \
  && mkdir -p .next/standalone/.next \
  && cp -r .next/static .next/standalone/.next/static \
  && cp -r public .next/standalone/public

# ─── Étape 2 : API + Chromium + standalone Next ───
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-freefont-ttf \
    fonts-noto-color-emoji \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV REPORT_RENDERER_PORT=3001

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

COPY --from=report-ui /build/.next/standalone ./tmp_v0_template/.next/standalone

EXPOSE 5000

CMD ["node", "scripts/start-with-renderer.js"]
