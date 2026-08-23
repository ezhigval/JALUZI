FROM mirror.gcr.io/library/node:22-alpine AS build

WORKDIR /app
COPY front/package.json front/package-lock.json ./
RUN npm ci
COPY front/ ./

ARG PUBLIC_API_URL=
ARG SITE_URL=https://piter-jaluzi.ru
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV SITE_URL=$SITE_URL

RUN npm run build

# caddy official image; if Hub is blocked, reuse the already-running web image and docker cp Caddyfile.
FROM caddy:2.10-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
