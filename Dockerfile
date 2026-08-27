# Dokku deploy image for FitPro Center
# Serves React dashboard at /, Flutter PWA at /pwa/, pairing page at /pair/,
# and reverse-proxies /api, /admin, /health, /ready to Django (gunicorn).

# ---- Stage 1: React dashboard (Vite) ----
FROM node:20-alpine AS dashboard
WORKDIR /build
COPY dashboard-react/package.json dashboard-react/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY dashboard-react/ .
RUN npm run build

# ---- Stage 2: Flutter PWA ----
FROM ghcr.io/cirruslabs/flutter:stable AS pwa
WORKDIR /build
COPY flutter-app/ .
RUN flutter config --enable-web \
    && flutter pub get \
    && flutter build web --release --base-href /pwa/

# ---- Stage 3: Django + nginx runtime ----
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx libmagic1 ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=dashboard /build/dist /opt/web/dashboard
COPY --from=pwa /build/build/web /opt/web/pwa
COPY pairpage/index.html /opt/web/pair/index.html

COPY dokku/web.sh /usr/local/bin/web.sh
COPY nginx/dokku-default.conf /etc/nginx/conf.d/default.conf
RUN chmod +x /usr/local/bin/web.sh \
    && mkdir -p /app/staticfiles /data/static /data/media \
    && rm -f /etc/nginx/sites-enabled/default

EXPOSE 8080