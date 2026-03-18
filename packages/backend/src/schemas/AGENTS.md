# packages/backend/src/schemas

## 總覽

所有資料實體的 TypeBox schema 定義與 migration 腳本。型別從 schema 靜態推導，不重複宣告。

## 實體清單

| 檔案 | 實體 | 有 migration |
|---|---|---|
| `Task.ts` | Task | 是 |
| `Project.ts` | Project | 是 |
| `Milestone.ts` | Milestone | 是 |
| `Person.ts` | Person | 是 |
| `Assignment.ts` | Assignment | 是 |
| `AuditLog.ts` | AuditLog | 否 |
| `Label.ts` | Label | 否 |
| `Planning.ts` | Planning | 否 |
| `Session.ts` | Session | 否 |

## 命名慣例

```typescript
// schema
export const taskSchema = t.Object({ ... });

// 型別從 schema 推導
export type Task = typeof taskSchema.static;

// migration（有歷史欄位變更的實體才需要）
export const taskMigrations = MigrationBuilder.create<OldestShape>()
  .addMigration("人類可讀描述", (data) => data.map(...))
  .build();
```

## Migration 規則

- migration 描述用繁體中文說明「為何遷移」
- 新欄位提供合理預設值（nullable 用 `null`，array 用 `[]`，boolean 用 `false`）
- 既有欄位格式調整（例如 `dueDate` 從 ISO datetime 改為純日期字串）需保留向後相容讀取

## Task schema 欄位說明

```typescript
{
  id, projectId, milestoneId,    // 關聯 ID（milestoneId nullable）
  name, description,
  isDone, completedAt,           // completedAt 由 API 自動設定，不由前端傳入
  isArchived,
  labelIds: string[],
  dueDate: string | null,        // 純日期格式 "YYYY-MM-DD"
  assigneeIds: string[],         // POST 時由 TaskAssigneePolicy 自動補入 requester
}
```

## 反模式

- 不手動重複宣告已由 schema 推導的型別
- schema 變更必須同步補 migration（即使只是新增 nullable 欄位）
