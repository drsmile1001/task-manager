# packages/backend/src

## 總覽

Elysia API 與資料層的根目錄。所有 HTTP endpoint 由 `buildApi()` 集中定義，資料透過 `EntityStoreYaml` 持久化到 YAML 檔案。

## 結構

```
src/
├── api.ts          # 所有 HTTP/WS endpoint（主要工作區）
├── index.ts        # 進入點：組裝依賴、啟動 server
├── public.ts       # 對外公開型別（前端透過 @backend/public 引用）
├── constants/      # 系統使用者定義
├── schemas/        # TypeBox schema + migration
└── services/       # 服務類：Repositories、RequesterResolver、AutoArchive 等
```

## 關鍵設計

### buildApi 依賴注入

`api.ts` 匯出 `buildApi(deps)` 函式，deps 包含：
- `logger` — `@drsmile1001/logger`
- `repos` — `AppRepositories`（全部 EntityStore）
- `mutationPublisher` — `MutationPublisherService`
- `requesterResolver` — `RequesterResolver` 介面

不在 `api.ts` 寫死任何 cookie/session 邏輯（已封裝進 `requesterResolver`）。

### derive 中間件

`.derive(async ({ cookie, headers, status }) => { ... })` 負責：
1. 解析 requester（session cookie 或 `x-api-key` header）
2. 注入 `logAction(entityType, action, entityId, changes)` 到每個 handler

`logAction` 必須 `await`，否則廣播與寫入順序不一致。

### endpoint 命名慣例

```
GET    /api/{entities}         → list
POST   /api/{entities}         → create（body = full schema）
GET    /api/{entities}/:id     → get one（404 if not found）
PATCH  /api/{entities}/:id     → update（body = t.Partial(schema)）
DELETE /api/{entities}/:id     → delete + cascade cleanup
```

GET 失敗 → `return status(404)`；Auth 失敗 → `throw status(401)`。

## 反模式

- 不在 `api.ts` 直接解析 cookie/API key（交給 `requesterResolver`）
- 不跳過 `logAction`：每個 CRUD 都要寫 audit log 並廣播
- 不在 DELETE handler 忽略級聯清理（參見 AGENTS.md 根目錄說明）
- `logAction` 禁止 fire-and-forget，必須 `await`
