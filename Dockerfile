# syntax=docker/dockerfile:1.7

FROM node:22-alpine3.22 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY index.html ./
COPY src/ ./src/

RUN npm run build

FROM alpine:3.22 AS runtime

RUN apk add --no-cache nginx \
    && rm -rf /usr/share/nginx/html/* \
    && cat > /etc/nginx/nginx.conf <<'EOF'
worker_processes auto;
pid /tmp/nginx.pid;
error_log /dev/stderr warn;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /dev/stdout;
    sendfile on;
    server_tokens off;

    client_body_temp_path /tmp/nginx/client_temp;
    proxy_temp_path       /tmp/nginx/proxy_temp;
    fastcgi_temp_path     /tmp/nginx/fastcgi_temp;
    uwsgi_temp_path       /tmp/nginx/uwsgi_temp;
    scgi_temp_path        /tmp/nginx/scgi_temp;

    server {
        listen 0.0.0.0:8080;
        listen [::]:8080;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        location = /healthz {
            access_log off;
            default_type text/plain;
            return 200 'ok\n';
        }

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
EOF

COPY --from=build --chown=nginx:nginx /app/dist/ /usr/share/nginx/html/

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
