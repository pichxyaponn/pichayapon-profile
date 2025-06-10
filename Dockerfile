FROM oven/bun:slim AS builder

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

COPY . .

RUN bun run build

FROM nginx:stable-alpine-slim

RUN apk add --no-cache curl

RUN mkdir -p /var/run/nginx && \
    touch /var/run/nginx/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx && \
    chown -R nginx:nginx /var/cache/nginx

RUN sed -i 's|/run/nginx.pid|/var/run/nginx/nginx.pid|' /etc/nginx/nginx.conf

COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

USER nginx

EXPOSE 2005

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:2005/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
