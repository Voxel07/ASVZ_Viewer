# syntax=docker/dockerfile:1

FROM oven/bun:1.4.4 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# Vite settings are embedded in the static assets at build time.
ARG VITE_POCKETBASE_URL=https://pb.matzeschneider.de
ENV VITE_POCKETBASE_URL=${VITE_POCKETBASE_URL}
RUN bun run --bun build

FROM nginx:1.31-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
