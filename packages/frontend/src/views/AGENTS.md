# packages/frontend/src/views

## 總覽

所有功能面板（panel）與主要視圖（view）元件。由 `PanelController` 管理，不直接 route。

## 結構

| 檔案 | 對應 PanelOptions.type | 說明 |
|---|---|---|
| `TaskDetailsPanel.tsx` | `TASK` | 任務詳情與編輯 |
| `TaskPool.tsx` | `TASK_POOL` | 任務池列表 |
| `ProjectDetailsPanel.tsx` | `PROJECT_DETAILS` | 專案詳情 |
| `ProjectListPanel.tsx` | `PROJECT_LIST` | 專案列表 |
| `MilestoneDetailsPanel.tsx` | `MILESTONE` | 里程碑詳情 |
| `PersonDetailsPanel.tsx` | `PERSON_DETAILS` | 人員詳情 |
| `PersonPanel.tsx` | `PERSON_LIST` | 人員列表 |
| `LabelPanel.tsx` | `LABEL` | 標籤管理 |
| `SharedFilterPanel.tsx` | `SHARED_FILTER` | 共用篩選 |
| `AuditLogListPanel.tsx` | `AUDIT_LOG` | 稽核紀錄 |
| `ImportTasksPanel.tsx` | `IMPORT_TASKS` | 匯入任務 |
| `ProjectArchivedTaskList.tsx` | `PROJECT_ARCHIVED_TASK_LIST` | 已封存任務 |
| `ProjectArchivedMilestoneList.tsx` | `PROJECT_ARCHIVED_MILESTONE_LIST` | 已封存里程碑 |
| `ByDaySchedule.tsx` | — | 按日排程主視圖 |
| `WeekScheduleTable.tsx` | — | 週表視圖 |

## 與 PanelController 的關係

每個面板型別必須同時存在於：
1. `PanelController.tsx` 的 `PanelOptions` union type
2. `PanelController.tsx` 的 `RenderPanel` switch case
3. 本目錄下的對應元件

三者缺一會導致面板無法顯示。新增面板時三個地方要同步更新。

## API 呼叫慣例（在 views 中）

```typescript
// 標準 CRUD 流程
const result = await client.api.tasks({ id }).patch(updates);
if (result.error) { /* 顯示錯誤 */ return; }
useTaskStore().setTask(result.data);    // 更新 store
usePanelController().pushPanel({ type: "TASK", taskId: result.data.id });  // 跳轉
```

- 呼叫 API → 檢查 result.error → 用 result.data 更新 store → 再跳轉面板
- 不在 views 直接 setStore，通過 store 的 setter 方法
- 匯入任務等批次操作（`ImportTasksPanel.tsx`）可多次 POST

## 反模式

- 不把業務邏輯寫死在 views（放 store）
- 不直接操作 store 的內部 map，透過 store 的 setter
- 新增面板若未更新 `PanelController.tsx` 的兩處，元件將無法被 render
