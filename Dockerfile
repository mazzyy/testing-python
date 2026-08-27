
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npx vite build

# Stage 2: Final Image (Python + Nginx)
FROM python:3.11-slim

# Install Nginx, envsubst (gettext-base), and system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    gettext-base \
    gcc \
    g++ \
    libpoppler-cpp-dev \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# Setup Backend
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .

# Setup Frontend (Copy from build stage)
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Create nginx config template directory and write template
# Uses NGINX_PORT which gets substituted at runtime via envsubst
RUN mkdir -p /etc/nginx/templates && \
    printf 'server {\n\
    listen %s;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location /api/ {\n\
        proxy_pass http://127.0.0.1:8000/api/;\n\
        proxy_set_header Host $host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
    }\n\
}\n' '${NGINX_PORT}' > /etc/nginx/templates/default.conf.template

# Create start script
RUN printf '#!/bin/bash\n\
# Heroku provides $PORT, default to 80 for local dev\n\
export NGINX_PORT=${PORT:-80}\n\
# Substitute NGINX_PORT into nginx config\n\
envsubst '"'"'${NGINX_PORT}'"'"' < /etc/nginx/templates/default.conf.template > /etc/nginx/sites-available/default\n\
# Start nginx in background\n\
service nginx start\n\
# Start backend (uvicorn)\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000\n' > /start.sh && chmod +x /start.sh

CMD ["/start.sh"]
