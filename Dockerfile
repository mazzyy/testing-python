# syntax=docker/dockerfile:1

FROM node:20.18.1-alpine3.21 AS build

WORKDIR /app

# Install the exact dependency graph before copying application sources.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy only files required by the Vite production build.
COPY index.html ./index.html
COPY src/ ./src/

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27.3-alpine AS runtime

# The unprivileged nginx image serves static files on port 8080.
COPY --from=build --chown=101:101 /app/dist/ /usr/share/nginx/html/

USER 101:101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
