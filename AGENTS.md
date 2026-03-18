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

- `packages/backend/src`：Elysia API 與資料層。→ 詳見 `packages/backend/src/AGENTS.md`
- `packages/backend/src/schemas`：TypeBox schema + migration。→ 詳見 `packages/backend/src/schemas/AGENTS.md`
- `packages/backend/src/services`：服務層（Repositories、RequesterResolver、AutoArchive 等）。→ 詳見 `packages/backend/src/services/AGENTS.md`
- `packages/backend/test`：Bun 測試（createTestCtx + fake 模式）。→ 詳見 `packages/backend/test/AGENTS.md`
- `packages/frontend/src/stores`：SolidJS 全域狀態 + PanelController。→ 詳見 `packages/frontend/src/stores/AGENTS.md`
- `packages/frontend/src/views`：功能面板與主視圖。→ 詳見 `packages/frontend/src/views/AGENTS.md`
- `packages/frontend/src/components`：可重用 UI 元件。→ 詳見 `packages/frontend/src/components/AGENTS.md`
- `docs/CODING_STYLE.md`：完整 coding style 規範（必讀）。

## 安裝與開發指令

```bash
bun install          # 安裝依賴
bun run dev          # 前後端一起
bun run dev:frontend # 只跑前端
bun run dev:backend  # 只跑後端
bun run build        # 完整 build
bun run format       # 全 workspace 格式化
bun run typecheck    # 跨 workspace 型別檢查（先產生 backend .d.ts）
bun --filter frontend typecheck  # 前端 typecheck
bun --filter backend typecheck   # 後端 typecheck
```

## 測試指令（重點：單一測試）

```bash
# Backend（建議在 backend 目錄執行）
bun test                                     # 全部測試
bun test test/utils/YamlRepo.test.ts         # 單一檔案
bun test test/utils/YamlRepo.test.ts -t "名稱 regex"

# Frontend（在 repo root 執行）
bun --filter frontend test
bun test packages/frontend/test/stores/assignmentState.test.ts
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

- API handler 通用寫法（命名、錯誤處理、紀錄慣例）請直接遵循 `docs/CODING_STYLE.md`。
- `buildApi(deps)` 依賴注入模式，詳見 `packages/backend/src/AGENTS.md`。
- Schema TypeBox 定義 + migration 規則，詳見 `packages/backend/src/schemas/AGENTS.md`。
- 刪除連動、身份解析、auto archive，詳見 `packages/backend/src/services/AGENTS.md`。
- 刪除連動規則摘要：project → task/assignment/planning/milestone；task → assignment/planning；person → assignment；label → 從 task.labelIds 移除；milestone → 清空 task.milestoneId。

## Frontend 改動注意事項

- 框架：SolidJS + Vite + Tailwind CSS。前端型別優先使用 `@backend/public`。
- Store 模式（singulation）與 PanelController，詳見 `packages/frontend/src/stores/AGENTS.md`。
- 面板元件與 PanelController 三處同步，詳見 `packages/frontend/src/views/AGENTS.md`。

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

- 測試模式（`createTestCtx`、fake 替身）詳見 `packages/backend/test/AGENTS.md`。
- API 測試使用 eden treaty 直接呼叫 app，不起 HTTP server。

---

若本檔與實際程式行為衝突，以「程式碼 + package.json scripts」為準，並在同一個 PR 修正文檔。
