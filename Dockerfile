# syntax=docker/dockerfile:1
# michaelgoldman.dev as a container: the static build served by unprivileged nginx on 8080.
#   docker build -t michaelgoldman-dev . && docker run --rm -p 8080:8080 michaelgoldman-dev
# Smoke test: scripts/docker-smoke.sh. The live site is GitHub Pages (.github/workflows/pages.yml).

ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:alpine
# ngx_brotli, pinned (google/ngx_brotli master, 2023-10-09). Only its static module is built.
ARG NGX_BROTLI_COMMIT=a71f9312c2deb28875acc7bacfdd5695a111aa53

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && node scripts/precompress.ts dist

# brotli_static for the exact nginx version of the runtime image (no nginx.org package exists).
FROM ${NGINX_IMAGE} AS brotli
ARG NGX_BROTLI_COMMIT
USER root
RUN apk add --no-cache build-base pcre2-dev zlib-dev openssl-dev linux-headers \
 && mkdir /src && cd /src \
 && wget -qO- "https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz" | tar xz \
 && wget -qO- "https://github.com/google/ngx_brotli/archive/${NGX_BROTLI_COMMIT}.tar.gz" | tar xz \
 && cd "nginx-${NGINX_VERSION}" \
 && ./configure --with-compat --add-dynamic-module="/src/ngx_brotli-${NGX_BROTLI_COMMIT}/static" \
 && make modules \
 && cp objs/ngx_http_brotli_static_module.so /src/

FROM ${NGINX_IMAGE}
COPY --from=brotli /src/ngx_http_brotli_static_module.so /usr/lib/nginx/modules/
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
USER 101
