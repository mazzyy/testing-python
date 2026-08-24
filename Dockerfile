# syntax=docker/dockerfile:1

FROM node:20.18.1-alpine3.20 AS build
WORKDIR /app

# Install the lockfile-resolved build dependencies first for cache efficiency.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy only files required by the Vite production build.
COPY index.html ./
COPY src ./src

RUN npm run build

FROM alpine:3.20.3 AS runtime

RUN addgroup -S -g 10001 app \
    && adduser -S -D -H -u 10001 -G app app \
    && mkdir -p /www \
    && chown app:app /www

# BusyBox httpd and wget are included in Alpine; no runtime packages are installed.
COPY --from=build --chown=app:app /app/dist/ /www/

USER app
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

STOPSIGNAL SIGTERM
ENTRYPOINT ["httpd", "-f", "-p", "8080", "-h", "/www"]
