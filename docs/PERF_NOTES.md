# 前端效能觀測筆記

## 目的

確認首頁明顯延遲是否來自 API 網路時間，或是前端 store 建索引與 reactive 重算成本。

## 觀測資料規模（backend data）

- `packages/backend/data/auditLogs.yaml`: 約 91,241 行（約 2.4MB）
- `packages/backend/data/assignments.yaml`: 約 5,426 行
- `packages/backend/data/tasks.yaml`: 約 4,551 行
- `packages/backend/data/plannings.yaml`: 約 88 行

## 首輪觀測結論（已驗證）

1. API 不是主要瓶頸
   - 多數 `api.get` 在 10~45ms。
2. 主要瓶頸在前端 reactive 重算風暴
   - `taskStore:relation.recompute` 在初始化時被觸發大量次數。
   - 單次約 8~11ms，累積後造成可感知卡頓。
3. `planningStore:index.build` 耗時異常偏高
   - 在資料筆數不高（29）時仍觀測到約 191ms。
   - 顯示問題不在資料量本身，而是逐筆更新造成多次重算。

## 目前判定的根因

- `assignmentStore.loadAssignments()` 與 `planningStore.loadPlannings()` 使用逐筆 `setState`，
  每次更新都可能觸發依賴（尤其 `taskStore` relation）重算。
- `sync.ts` 在 TASK 刪除時採用全量 `loadPlannings()`、`loadAssignments()`，
  導致可避免的全量重建開銷。

## 後續優化方向（待實作）

1. `assignment/planning` 改為批次建索引後單次 `setState`。
2. TASK 刪除改為局部清理（by taskId），避免全量 reload。
3. 視需要將 audit log 改 lazy load（面板開啟時載入）。

## 進度更新（已實作）

- `assignmentStore.loadAssignments()` 已改為批次建索引後單次 `setState`。
- `planningStore.loadPlannings()` 已改為批次建索引後單次 `setState`。
- `sync.ts` 的 TASK DELETE 已改為局部清理：
  - `deletePlanningsByTaskId(taskId)`
  - `deleteAssignmentsByTaskId(taskId)`
- 相關觀測指標名稱：
  - `sync:task.delete.cleanupPlannings`
  - `sync:task.delete.cleanupAssignments`

## 觀測工具使用方式

前端內建 `perf` 工具，可透過 env 或 runtime 開關使用。

- env 開關：`packages/frontend/.env.local`

```bash
VITE_TM_PERF=1
```

- 瀏覽器 runtime 覆蓋：

```js
window.__TM_PERF__.enable();
window.__TM_PERF__.disable();
```

- 匯出與分析當前 session 記錄：

```js
window.__TM_PERF__.summaryByName();
window.__TM_PERF__.dump();
window.__TM_PERF__.getRecords();
window.__TM_PERF__.clear();
```

> 註：目前保留的 log 以「索引建立 / relation 重算 / task delete 清理」為主，
> 避免非關鍵訊號造成觀測雜訊。
