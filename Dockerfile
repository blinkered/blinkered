# syntax=docker/dockerfile:1

# Blinkered is a static site once built: two HTML pages, one bundle, and sixteen word lists.
# So the image is a build stage that produces those files and a web server that serves them,
# and nothing at runtime is Node.

FROM node:22-alpine AS build
WORKDIR /src

# Corepack takes the pnpm version from package.json's `packageManager`, so the image builds
# with the same pnpm the repo is developed against rather than whatever is newest.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

# Pre-compress everything text, because the word lists are the payload and they are large:
# Russian is 8.3MB of UTF-8 that gzips to 1.2MB. Doing it here means nginx serves a file it
# already has rather than compressing 8MB per request, per language, forever.
RUN set -eu; \
    cd apps/web/dist; \
    find . -type f \( -name '*.txt' -o -name '*.js' -o -name '*.css' -o -name '*.html' \
      -o -name '*.json' -o -name '*.map' -o -name '*.webmanifest' -o -name '*.svg' \) -print0 \
    | while IFS= read -r -d '' file; do gzip -9 -c "$file" > "$file.gz"; done

# The API, which is Node and therefore cannot share the web image.
#
# `pnpm deploy` is what makes this small: it resolves the workspace links and writes a
# self-contained directory with real `node_modules` and production dependencies only. Copying
# `/src` wholesale would work and would carry the 35MB of word lists, the dev toolchain and every
# other package into an image that needs none of them.
FROM node:22-alpine AS api-build
WORKDIR /src
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY --from=build /src /src
RUN pnpm deploy --filter=@blinkered/server --prod --legacy /out

FROM node:22-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
COPY --from=api-build /out /app
# Node's own uid in this image, so nothing runs as root.
USER node
EXPOSE 8080
CMD ["node", "dist/src/bin/serve.js"]

# Unprivileged: it listens on 8080 as uid 101, so the pod needs no root and no capabilities.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS serve

COPY deploy/nginx.shared.conf /etc/nginx/blinkered-shared.conf
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/apps/web/dist /usr/share/nginx/html

EXPOSE 8080
