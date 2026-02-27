# AGENTS 指南（task-manager）

本文件提供給在此 repo 內工作的 agent（如 OpenCode、Cursor Agent、Copilot Agent）。
目標是讓 agent 在最少互動下，做出一致、可維護、可驗證的修改。

- 程式風格、命名、模組設計等通用規範，請以 `docs/CODING_STYLE.md` 為唯一準則。
- 本文件聚焦 repo 當前行為、工作流程、測試與文件同步要求。

## 專案定位與開發前提

- 本系統服務對象：公司內單一部門，約 30 人以內。
- 核心用途：綜合工作追蹤、排程安排、跨人員協作分派。
- 維運策略：設計上應可由 1 人進行日常維護與功能迭代。
- 開發原則：優先清晰、可讀、低複雜度，而非過度抽象化。

## Repo 結構（Monorepo）

- runtime / package manager：Bun。
- workspace：`packages/backend`、`packages/frontend`。
- 根目錄 `scripts/build.ts` 會組裝正式輸出到 `dist/`。

主要目錄：

- `packages/backend/src`：Elysia API 與資料層。
- `packages/backend/src/utils`：共用 logger、工具。
- `packages/backend/test`：Bun 測試。
- `packages/frontend/src`：SolidJS 前端程式。
- `docs/CODING_STYLE.md`：完整 coding style 規範（必讀）。

## 安裝與開發指令

在 repo 根目錄執行：

```bash
bun install
```

### 啟動開發環境

```bash
# 前後端一起跑
bun run dev

# 只跑前端
bun run dev:frontend

# 只跑後端
bun run dev:backend
```

### Build

```bash
# 完整 build（前後端 + 組裝 dist）
bun run build

# 僅前端
bun run build:frontend

# 僅後端
bun run build:backend
```

### 格式化 / 型別檢查

```bash
# 全 workspace 格式化
bun run format

# 前端 typecheck（noEmit）
bun --filter frontend typecheck

# 後端 typecheck
bun --filter backend typecheck

# 跨 workspace 型別檢查（先產生 backend .d.ts）
bun run typecheck
```

## 測試指令（重點：單一測試）

目前測試主要在 backend，使用 `bun:test`。

```bash
# 建議在 backend package 目錄執行
cd packages/backend

# 全部測試
bun test

# 跑單一測試檔案
bun test test/utils/YamlRepo.test.ts

# 跑單一測試名稱（regex）
bun test test/utils/YamlRepo.test.ts -t "可從空白檔案讀取"
```

若你使用 repo 根目錄執行，也可指定路徑：

```bash
bun test packages/backend/test/utils/YamlRepo.test.ts
```

前端目前有小規模純邏輯測試（reducers/helpers），同樣使用 `bun:test`：

```bash
# 在 repo root 執行
bun --filter frontend test

# 跑單一前端測試檔
bun test packages/frontend/test/stores/assignmentState.test.ts

# 跑單一測試名稱（regex）
bun test packages/frontend/test/stores/assignmentState.test.ts -t "可刪除指定 taskIds"
```

## Agent 工作流程（建議）

1. 先讀本檔 + `docs/CODING_STYLE.md`。
2. 先做最小可行改動（smallest useful change）。
3. 改完至少跑：
   - 格式化：`bun run format`
   - 受影響區域測試（至少單測）
4. 若改到 API schema 或 store，務必檢查前後端型別連動。
5. 提交前在說明中交代：改動點、風險、驗證方式。

## 目前 lint / 規則現況

- 目前 repo 未配置 ESLint / Biome 腳本。
- 現階段以 `prettier + sort-imports + TypeScript strict` 維持品質。
- 看到可疑命名或拼字錯誤（例如歷史欄位 typo）時：
  - 優先評估相容性影響。
  - 不要在無需求時進行大規模破壞式更名。

## Cursor / Copilot 規則檔狀態

經檢查，目前 repository **不存在**以下檔案：

- `.cursor/rules/`
- `.cursorrules`
- `.github/copilot-instructions.md`

因此目前沒有額外 Cursor/Copilot 指令可覆蓋本文件。
未來若新增上述檔案，agent 應先讀取再執行任務。

## Backend 改動注意事項

- API 框架：Elysia。
- Schema 優先使用 TypeBox（`t.Object(...)`）定義，型別由 schema 推導。
- 資料儲存採 YAML repo（`createYamlRepo`），改 schema 時要同步考慮 migration。
- API handler 通用寫法（命名、錯誤處理、紀錄慣例）請直接遵循 `docs/CODING_STYLE.md`。

- 身份解析（requester）
  - 目前透過 `RequesterResolver` 注入，不要在 `api.ts` 寫死 cookie/api key 判斷。
  - 正式環境使用 `RequesterResolverDefault`（由 `index.ts` 建立並注入）。
  - API 測試可注入 fake resolver，切換不同 requester 情境。

- assignment 與 task assignee 連動
  - `POST/PATCH /api/assignments` 若 `personId` 未在 task `assigneeIds`，會自動補上。
  - 此連動需同時記錄 `TASK UPDATE` audit log 並廣播 mutation。

- 刪除與連動更新規則（目前實作）
  - `DELETE /api/projects/:id`：會級聯清理 project 底下的 `task`、`assignment`、`planning`、`milestone`。
  - `DELETE /api/tasks/:id`：會級聯清理該 task 的 `assignment` 與 `planning`。
  - `DELETE /api/persons/:id`：會清理該 person 的 `assignment`。
  - `DELETE /api/labels/:id`：會從所有 task 的 `labelIds` 移除該 label。
  - `PATCH /api/milestones/:id`（`dueDate` 有傳入）：只更新 dueDate 不一致的 tasks，並逐筆廣播 `TASK UPDATE`。
  - `DELETE /api/milestones/:id`：會清空關聯 task 的 `milestoneId`，並逐筆廣播 `TASK UPDATE`。

## Frontend 改動注意事項

- 框架：SolidJS + Vite + Tailwind CSS。
- 全域狀態以 store 模式（`useXxxStore`）與 singulation 管理。
- 面板導向互動透過 `PanelController`，新增面板請同步更新 union type 與渲染分派。
- 呼叫 API 請沿用既有 `client`（eden treaty）與型別來源。
- 前端若需引用 backend 型別，優先使用 `@backend/public`，避免依賴 backend 內部檔案路徑。

## 安全與設定

- 不提交任何 `.env` 或敏感資訊。
- 常用環境變數（依程式碼）：
  - backend: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_HD_RESTRICTION`, `API_KEY`, `BASE_URL`, `LOG_LEVEL`, `LOG_WITH_CONTEXT`, `AUTO_ARCHIVE_ENABLED`, `AUTO_ARCHIVE_DAYS`, `AUTO_ARCHIVE_TZ`
  - frontend: `VITE_GOOGLE_CLIENT_ID`, `BASE_URL`

- 後端 auto archive 規則：
  - task：封存 7 天前已完成且未封存項目。
  - milestone：封存 7 天前已到期且未封存項目（不看底下 task 是否完成）。

## 文件同步原則

當你做以下修改時，請同步更新文件：

- 指令變更：更新 `AGENTS.md` 與 `README.md`。
- 風格或架構慣例變更：更新 `docs/CODING_STYLE.md`。
- 新增 agent 規範檔（Cursor/Copilot）：在 `AGENTS.md` 補充優先順序。

## Backend API 測試慣例（Eden + fake）

- API 測試檔：`packages/backend/test/api.test.ts`。
- 測試 fake 統一放 `packages/backend/test/fake/`。
- fake 實作負責：
  - 設定 seed 假資料
  - 記錄呼叫（repo / resolver / publisher）
  - 提供測試斷言所需的檢視能力
- `test/helpers/InMemoryRepo.ts` 保持底層 helper；行為擴充集中在 fake 層。

---

若本檔與實際程式行為衝突，以「程式碼 + package.json scripts」為準，並在同一個 PR 修正文檔。
