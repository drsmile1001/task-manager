# packages/backend/src/services

## 總覽

後端服務層：資料倉儲、身份解析、mutation 廣播、定時封存。

## 服務清單

| 檔案 | 用途 |
|---|---|
| `Repositories.ts` | `AppRepositories` 型別定義 + `EntityStoreYaml` 工廠函式 |
| `RequesterResolver.ts` | `RequesterResolver` 介面 + `RequesterResolverDefault` 實作 |
| `MutationPublisher.ts` | WS 廣播服務（`mutationPublisher.publish(auditLog)`） |
| `TaskAssigneePolicy.ts` | task 建立時自動將 requester 加入 assigneeIds |
| `AutoArchiveScheduler.ts` | 排程器，每日 00:00 觸發封存 |
| `TaskAutoArchiveService.ts` | 封存 7 天前完成且未封存的 task |
| `MilestoneAutoArchiveService.ts` | 封存 7 天前到期且未封存的 milestone |

## AppRepositories

全部 9 個 EntityStore（`EntityStoreYaml`）統一由 `createRepositories(logger)` 建立，`initRepositories(repos)` 初始化（讀取 YAML + 執行 migration）。

資料路徑：`data/*.yaml`（相對於 backend 工作目錄）。

## RequesterResolver 介面

```typescript
interface RequesterResolver {
  resolve(ctx: { apiKey?: string; sessionId?: string }): Promise<Person | undefined>;
}
```

- 正式環境：`RequesterResolverDefault`（session cookie + API key）
- 測試環境：`FakeRequesterResolver`（inject 任意 requester）

不在 `api.ts` 直接處理認證邏輯，透過此介面解耦。

## AutoArchive 組態

由 `index.ts` 從環境變數注入：
- `AUTO_ARCHIVE_ENABLED`（預設 `1`）
- `AUTO_ARCHIVE_DAYS`（預設 `7`）
- `AUTO_ARCHIVE_TZ`（預設 `Asia/Taipei`）

## 反模式

- 不在 services 以外的地方直接讀取 `Bun.env.*` 進行認證判斷
- `AutoArchiveScheduler` 啟動後需在 shutdown 時呼叫 `.stop()`
