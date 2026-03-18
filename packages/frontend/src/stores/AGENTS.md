# packages/frontend/src/stores

## 總覽

全域狀態管理層。每個 store 以 `singulation` 實現單例，透過 `createStore`（SolidJS）管理響應式狀態。

## 結構

```
stores/
├── taskStore.ts          # 最複雜的 store，含關聯計算（TaskWithRelation）
├── assignmentStore.ts
├── planningStore.ts
├── milestoneStore.ts
├── projectStore.ts
├── personStore.ts
├── labelStore.ts
├── auditLogStore.ts
├── currentUserStore.ts
├── systemUserStore.ts
├── holidayStore.ts
├── syncStatusStore.ts
├── preferenceStore.ts
├── SharedFilterStore.ts
├── projectSort.ts
├── PanelController.tsx   # 面板導向 UI 控制器
├── DragController.tsx    # 拖曳狀態
└── reducers/             # 純函式：assignmentState.ts、planningState.ts
```

## Store 模式

```typescript
function createXxxStore() {
  const [map, setMap] = createStore({} as Record<string, Xxx | undefined>);
  async function loadXxx() { /* 呼叫 client.api.xxx.get() */ }
  loadXxx(); // 立即初始化
  function setXxx(item: Xxx) { setMap(item.id, item); }
  function deleteXxx(id: string) { setMap(id, undefined); }
  function getXxx(id: string): Xxx | undefined { return map[id]; }
  return { setXxx, deleteXxx, getXxx, loadXxx };
}

export const useXxxStore = singulation(createXxxStore);
```

命名規則：`createXxxStore` + `useXxxStore`，export `useXxxStore`。

## singulation 模式

`singulation(factory)` 建立惰性單例：第一次呼叫才執行 `factory()`，之後返回同一個實例。store 間依賴直接呼叫 `useYyyStore()` 取實例，不需傳入。

## PanelController

面板導向 UI 的核心：
- `PanelOptions`：所有面板型別的 union type（UPPER_SNAKE_CASE）
- `openPanel(options)` — 替換整個 stack
- `pushPanel(options)` — 疊加一層（深度遞增）
- `closePanel()` / `popPanel()`
- 新增面板時必須同時更新 `PanelOptions` union type 與 `RenderPanel` switch

## TaskWithRelation

`taskStore` 的 `tasksWithRelation()` 回傳含計算欄位的 task：
- `project`, `milestone`, `assignees[]`, `labels[]`
- `assignments[]`, `plannings[]`
- `statusLevel: "danger" | "warn" | "ongoing" | "done" | "archive"`
- `hasActiveAssignments`, `hasActivePlannings`, `isArchivedComputed`, `isOverdue`

## sync 整合

`sync.ts` 透過 WS 接收 mutation 後直接呼叫 store 的 `setXxx` / `deleteXxx`，不需要整個 reload。

## 反模式

- 不把業務邏輯寫在 UI 元件裡，放 store
- 不直接呼叫 API，透過 store 的 `loadXxx` / action 方法
- 新增面板後不更新 PanelController → runtime 會漏 render
- 不重複宣告 store 中已有的型別
