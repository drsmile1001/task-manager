# packages/frontend/src/components

## 總覽

可重用 UI 元件與 block，跨頁面使用。不含頁面級業務邏輯。

## 元件清單

| 檔案 | 類型 | 說明 |
|---|---|---|
| `Button.tsx` | 原子元件 | 通用按鈕 |
| `Input.tsx` | 原子元件 | 文字輸入框 |
| `Textarea.tsx` | 原子元件 | 多行文字框 |
| `Checkbox.tsx` | 原子元件 | 勾選框 |
| `MarkdownTextarea.tsx` | 複合元件 | Markdown 編輯器（107 行） |
| `Panel.tsx` | 容器元件 | 面板外框（讀取 usePanelController） |
| `TaskBlock.tsx` | block 元件 | 任務卡片（含 pushPanel 互動） |
| `MilestoneBlock.tsx` | block 元件 | 里程碑卡片 |
| `AuditLogBlock.tsx` | block 元件 | 稽核紀錄條目（242 行） |
| `LabelLine.tsx` | block 元件 | 標籤顯示行 |

## 分層原則

- `components/`：小型可重用元件，跨多個 views 使用
- `views/`：功能性面板，對應 PanelController 的面板類型

## 使用慣例

- `TaskBlock` 與 `MilestoneBlock` 會呼叫 `usePanelController().pushPanel(...)` 開啟詳細頁
- `Panel.tsx` 包裝面板外框，內部讀取 `popPanel`（關閉按鈕）
- 業務資料從 store 取（`useTaskStore()`, `usePersonStore()` 等），不直接呼叫 API

## 反模式

- 不在 components 寫入 API 呼叫（除非是非常局部的互動，但通常放 views）
- 不把只用一次的元件放這裡（直接放在對應 view 內）
