# syntax=docker/dockerfile:1.7

FROM node:20.18.1-alpine AS build
WORKDIR /app

# Install the lockfile-resolved build dependencies only.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy only files required to produce the static bundle.
COPY index.html ./
COPY src/ ./src/

RUN npm run build \
    && npm cache clean --force

FROM nginx:1.26.3-alpine AS runtime

USER root

# Create a dedicated runtime identity and remove the image's default site.
RUN addgroup -S -g 10001 app \
    && adduser -S -D -H -u 10001 -G app app \
    && rm -rf /usr/share/nginx/html/*

# Configure nginx to operate entirely as a non-root process.
RUN <<'EOF'
cat > /etc/nginx/nginx.conf <<'NGINX'
worker_processes auto;
error_log /dev/stderr notice;
pid /tmp/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';
    access_log /dev/stdout main;

    sendfile on;
    keepalive_timeout 65;
    server_tokens off;

    client_body_temp_path /tmp/client_temp;
    proxy_temp_path       /tmp/proxy_temp;
    fastcgi_temp_path     /tmp/fastcgi_temp;
    uwsgi_temp_path       /tmp/uwsgi_temp;
    scgi_temp_path        /tmp/scgi_temp;

    server {
        listen 8080;
        listen [::]:8080;
        root /usr/share/nginx/html;
        index index.html;

        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        location = /healthz {
            access_log off;
            default_type text/plain;
            return 200 "ok\n";
        }

        location /assets/ {
            try_files $uri =404;
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options "nosniff" always;
        }

        location / {
            try_files $uri $uri/ =404;
        }
    }
}
NGINX
EOF

COPY --from=build --chown=10001:10001 /app/dist/ /usr/share/nginx/html/

USER 10001:10001

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

ENTRYPOINT ["nginx", "-g", "daemon off;"]
