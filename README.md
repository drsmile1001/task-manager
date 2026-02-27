# task-manager

內部用任務管理系統（Bun Monorepo）。

## 專案目標與開發前提

- 服務對象：公司內單一部門，約 30 人以內。
- 核心用途：綜合工作追蹤、排程安排、跨人員協作分派。
- 維運策略：功能設計與程式結構以可由 1 人簡單維護為優先。

## 技術架構

- Runtime / Package Manager：Bun
- Monorepo workspace：`packages/backend`、`packages/frontend`
- Backend：Elysia + TypeBox + YAML repository
- Frontend：SolidJS + Vite + Tailwind CSS

## 快速開始

### 安裝依賴

```bash
bun install
```

### 啟動開發環境

```bash
# 前後端一起
bun run dev

# 僅前端
bun run dev:frontend

# 僅後端
bun run dev:backend
```

## Build

```bash
# 完整 build（前後端 + 組裝 dist）
bun run build

# 僅前端
bun run build:frontend

# 僅後端
bun run build:backend
```

## 格式化、型別檢查、測試

```bash
# 全 workspace 格式化
bun run format

# 前端 typecheck
bun --filter frontend typecheck

# 後端 typecheck
bun --filter backend typecheck

# 跨 workspace 型別檢查
bun run typecheck
```

### 測試（Bun）

目前測試主要在 backend。

```bash
# 建議進入 backend 目錄
cd packages/backend

# 全測試
bun test

# 單一測試檔
bun test test/utils/YamlRepo.test.ts

# 單一測試名稱（regex）
bun test test/utils/YamlRepo.test.ts -t "可從空白檔案讀取"
```

### 前端（小規模純邏輯單元測試）

```bash
# 於 root 執行
bun --filter frontend test

# 跑單一測試檔
bun test packages/frontend/test/stores/assignmentState.test.ts

# 跑單一測試名稱（regex）
bun test packages/frontend/test/stores/assignmentState.test.ts -t "可刪除指定 taskIds"
```

## 目錄說明

- `packages/backend/src`：API 與資料邏輯
- `packages/backend/src/utils`：共用 logger / 工具
- `packages/backend/test`：backend 測試
- `packages/frontend/src`：前端應用程式
- `scripts/build.ts`：產出正式 `dist/` 的組裝腳本
- `docs/CODING_STYLE.md`：程式風格與開發慣例
- `AGENTS.md`：給 agentic coding agents 的執行指南

## 文件導引

- 開發前先讀：`AGENTS.md`
- 風格規範：`docs/CODING_STYLE.md`
- 效能觀測：`docs/PERF_NOTES.md`

## 前端效能觀測開關

在 `packages/frontend/.env.local` 加入：

```bash
VITE_TM_PERF=1
```

瀏覽器提供 `window.__TM_PERF__` 可直接輸出當前 session 的觀測資料：

- `window.__TM_PERF__.summaryByName()`
- `window.__TM_PERF__.dump()`
- `window.__TM_PERF__.getRecords()`
- `window.__TM_PERF__.clear()`

若文件與程式碼行為不一致，以程式碼與 `package.json` scripts 為準，並建議在同一個 PR 修正文檔。

## 已知目前 ws 問題

相關文件在 `docs/WS_ISSUES.md`，包含目前已知的問題與預計解法。
