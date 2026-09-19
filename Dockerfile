# ── Kutubxona.uz — React (Vite) frontend → nginx ─────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Bo'sh VITE_API_URL — barcha so'rovlar bir xil origin'ga ketadi va
# nginx ularni backend'ga proksilaydi (CORS kerak emas).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Runtime ──────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine
# .mjs (ES module) fayllar to'g'ri MIME bilan berilsin - pdf.js worker va boshqa modullar
RUN sed -i 's/ js;/ js mjs;/' /etc/nginx/mime.types

COPY --from=build /app/dist /usr/share/nginx/html
# nginx:alpine ishga tushganda ${VAR} larni env bilan almashtiradi
# (MEDIA_ALLOWED_HOSTS, MEDIA_ALLOWED_IPS, MEDIA_GUARD)
COPY nginx.conf /etc/nginx/templates/default.conf.template

ENV MEDIA_GUARD=on     MEDIA_ALLOWED_HOSTS="localhost|127\.0\.0\.1"     MEDIA_ALLOWED_IPS="127\.0\.0\.1" 

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
    CMD wget -q --spider http://127.0.0.1/ || exit 1
