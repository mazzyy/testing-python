# syntax=docker/dockerfile:1

FROM node:20.18.1-alpine AS build

WORKDIR /app

# Install the exact dependency graph before copying application sources.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy only files required by the Vite production build.
COPY index.html ./index.html
COPY src/ ./src/

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27.4-alpine AS runtime

# Copy only the generated static production assets.
COPY --from=build --chown=101:101 /app/dist/ /usr/share/nginx/html/

USER 101:101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:8080/"]

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
