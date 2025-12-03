FROM oven/bun:latest AS build

WORKDIR /app

COPY . .
RUN bun install
RUN bun run build

FROM gcr.io/distroless/base AS runtime
WORKDIR /app
COPY --from=build /app/dist ./
EXPOSE 3000
CMD ["./server"]
