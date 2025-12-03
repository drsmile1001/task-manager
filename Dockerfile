FROM oven/bun:latest AS build

WORKDIR /app

COPY . .
RUN bun install
RUN bun run build

FROM alpine:3.14 AS runtime
WORKDIR /app
COPY --from=build /app/dist ./
EXPOSE 3000
CMD ["./server"]
