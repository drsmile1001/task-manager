# Coding Style（task-manager）

本文件定義本專案的程式風格，提供給人類開發者與 agent 共同遵循。
若需求緊急，請優先遵守「可讀性、可維護性、可驗證」三原則。

## 總體原則

- 以「小步、可回滾」為原則，避免一次改過多檔案。
- 優先延續既有模式，不為了抽象化而抽象化。
- 代碼要讓 1 人可持續維運，避免複雜框架技巧。
- 若規格不明，先選最保守且相容的做法。

## 語言與工具

- 語言：TypeScript（frontend/backend 皆為 strict 模式）。
- Runtime/PM：Bun。
- Frontend：SolidJS + Vite + Tailwind CSS。
- Backend：Elysia + TypeBox schema + YAML repository。

## 格式與排版

專案目前使用 Prettier，請不要手動對抗 formatter。

- `semi: true`
- `singleQuote: false`
- `trailingComma: es5`
- 使用 `@trivago/prettier-plugin-sort-imports` 排序 import
- 每次提交前至少執行 `bun run format`

## Import 規範

- 優先使用 alias import（如 `@frontend/*`、`@backend/*`）。
- `import type` 與一般 import 分清楚，型別請用 type-only import。
- import 分組與排序以 `.prettierrc.yaml` 為準，不手動插隊。
- 非必要不要使用深層相對路徑（`../../../`）。

## 型別規範

- 禁止使用 `any` 作為預設選項；若不得不用，需限制範圍並加上理由。
- 盡量由 schema 推導型別，而非重複手寫同型別。
- nullable 欄位明確使用 `null`，避免 `undefined/null` 混用。
- 需要 union 時，優先使用字串 literal union（例如 panel type）。
- 前後端共用資料結構時，前端優先從 `@backend/public` 引用公開型別入口。

## 命名慣例

- 變數/函式：`camelCase`。
- 型別/介面/元件：`PascalCase`。
- 常數：語意清楚，可用 `UPPER_SNAKE_CASE`。
- Store 命名固定：`createXxxStore` + `useXxxStore`。
- 布林命名使用 `is/has/can/should` 前綴（如 `isDone`、`hasAllowedExtension`）。

## 函式與模組設計

- 單一函式只做一件事，過長時拆小函式。
- 優先早期返回（early return）減少巢狀層級。
- 工具函式保持純函式；副作用集中在邊界層（API handler、store action）。
- 不要過度抽象：若只被呼叫 1 次，不需強行抽共用。

## Backend 規範

### API 與 schema

- 使用 Elysia route + TypeBox schema（`t.Object`, `t.Partial`）。
- request/response 欄位命名保持一致，不做無意義縮寫。
- 權限或身份檢查失敗，明確回傳 `status(401)`。
- 查無資料時，明確回傳 `status(404)`。
- 新增/編輯 API（`POST/PATCH`）優先回傳最終實體結果，不回傳 audit log。

### Requester 解析

- requester 解析透過 `RequesterResolver` 注入，避免把驗證流程寫死在 `api.ts`。
- 正式環境使用 `RequesterResolverDefault`，測試時可注入 fake resolver。

### 資料層與 migration

- YAML repo 的 schema 變更，必須同步補 migration。
- migration 描述要說明「為何遷移」與「預設值策略」。
- 變更資料格式時，優先保留向後相容讀取路徑。

### 觀測性與紀錄

- 優先使用既有 logger，不直接散落 `console.log`。
- 關鍵 CRUD 異動要寫 audit log，並推播 mutation。
- log 訊息重點為可追查，不需冗長。
- 若單次請求會連動更新其他實體（例如 assignment 連動 task assignee），連動更新也要寫對應 audit log。

## Frontend 規範

### UI 與元件

- 元件保持小而清楚，避免巨大 JSX 區塊。
- 可重用的 UI（Button/Input/Panel）優先放 `components/`。
- 視圖層聚焦展示與互動，資料行為放 store。

### 狀態管理

- 全域狀態以 `solid-js/store` + singulation 模式管理。
- API 載入邏輯集中於 store（`loadXxx`）。
- store 的 set/delete/get 介面命名保持一致。
- 新增面板時，同步更新 `PanelController` 的 union type 與渲染 switch。

### API 呼叫

- 一律透過既有 `client`（eden treaty），不要重複造 fetch wrapper。
- 對錯誤情境要有明確處理（至少 throw 或顯示可理解訊息）。
- 批次關聯更新優先由既有 sync/mutation 流程承接。

## 錯誤處理原則

- Backend：以 HTTP status + logger 呈現錯誤脈絡。
- Frontend：store 層可 `throw new Error(...)`，由上層 UI 決定提示方式。
- 不吞錯誤；若要降級處理，需留下可追蹤訊息。
- 涉及 I/O（檔案、網路）必須有失敗路徑。

## 測試與驗證

- 既有測試框架：`bun:test`（目前以 backend 為主）。
- 修改行為邏輯時，至少補或更新對應單元測試。
- 先跑受影響測試，再視情況跑全測試。
- backend API 測試使用 `@elysiajs/eden`，測試 fake 統一放 `packages/backend/test/fake/`。
- `test/helpers/InMemoryRepo.ts` 保持底層 helper；seed/call 檢查/斷言輔助放在 fake 實作層。
- 常用指令：
  - `bun test`
  - `bun test test/utils/YamlRepo.test.ts`
  - `bun test test/utils/YamlRepo.test.ts -t "可從空白檔案讀取"`
  - `bun test test/api.test.ts`

## Commit 與文件同步

- Commit 應描述改動意圖（why），不只列出檔名（what）。
- 若更動開發指令，需同步更新 `README.md`、`AGENTS.md`。
- 若更動風格或架構慣例，需同步更新本文件。

## 反模式（避免）

- 無需求驅動的大規模命名重構。
- 在不同層重複宣告同一資料結構型別。
- 把業務邏輯直接寫死在 UI 元件。
- 未驗證就提交（至少格式化 + 受影響測試）。

## 衝突處理優先順序

當規範互相衝突時，依序採用：

- 可運行的程式碼與既有測試。
- `package.json` scripts 與實際工具配置。
- `AGENTS.md` 的流程規範。
- 本文件（`docs/CODING_STYLE.md`）的風格建議。

若發現文件與實作不一致，請在同一次變更中一起修正文件。
