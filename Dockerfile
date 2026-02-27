FROM oven/bun:latest AS build

WORKDIR /app

COPY . .
RUN bun install
RUN bun run build

FROM oven/bun:latest AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Asia/Taipei
ENV AUTO_ARCHIVE_ENABLED=1
ENV AUTO_ARCHIVE_DAYS=7
ENV AUTO_ARCHIVE_TZ=Asia/Taipei
COPY --from=build /app/dist ./
EXPOSE 3000
CMD ["./server"]
