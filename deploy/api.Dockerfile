FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY back/package.json back/package-lock.json ./
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci --omit=dev

COPY back/src ./src
COPY back/data/db.seed.json ./data/db.seed.json
COPY deploy/api-entrypoint.sh /api-entrypoint.sh
RUN chmod +x /api-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3001

ENTRYPOINT ["/api-entrypoint.sh"]
