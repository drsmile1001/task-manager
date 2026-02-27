# WebSocket 通訊穩定性與離線保護方案（草案）

## 背景

本系統採「API 寫入 + WebSocket 廣播 mutation」實作即時共編。  
若前端未能感知 WS 斷線狀態，可能在資料不同步時仍持續送出 mutation，導致資料一致性風險。

## 目標

1. 讓使用者明確知道目前同步狀態。
2. 在 WS 不可靠時阻擋寫入（安全優先）。
3. 連線恢復後自動收斂資料（resync）。
4. 保持可觀測、可回歸驗證。

## 同步狀態模型

- `connecting`：初始連線中
- `connected`：連線健康，可寫入
- `reconnecting`：斷線後重連中（含次數）
- `stale`：heartbeat/pong 逾時，判定為不可靠
- `disconnected`：socket 關閉或錯誤

## 重新規劃（2026-02）

### Phase 1：連線可視化與重連（高優先）

- [x] 建立同步狀態 store：`connecting/connected/reconnecting/stale/disconnected`
- [x] 補齊 `onerror/onclose` 與指數退避重連（含 jitter）
- [x] 補齊 heartbeat watchdog（pong timeout -> stale -> reconnect）
- [x] UI 顯示同步狀態與斷線提醒

### Phase 2：離線寫入保護（高優先）

- [x] client request guard：非 `connected` 阻擋 mutation（POST/PATCH/DELETE）
- [x] 保留 `GET/HEAD/OPTIONS` 讀取
- [x] `login/logout` bypass

### Phase 3：重連後一致性收斂（中優先）

- [x] 重連成功後執行 `resyncAll()`
- [ ] 視需要補 server-side sequence/cursor（避免大量全量 resync）

## 核心機制

1. **Heartbeat + Watchdog**
   - 每 10 秒送 `ping`
   - 若超過 30 秒未收到 `pong`，標記 `stale` 並主動關閉 socket 進入重連流程

2. **重連策略**
   - 指數退避 + jitter（避免 thundering herd）
   - 重連成功後自動執行 `resyncAll()`（labels/persons/projects/milestones/tasks/plannings/assignments）

3. **寫入守門（Fail-safe）**
   - 當同步狀態非 `connected` 時，阻擋 mutation request（POST/PATCH/DELETE）
   - `GET/HEAD/OPTIONS` 仍可讀
   - `login/logout` 可列為 bypass

4. **UI 可視化**
   - 顯示同步狀態徽章（同步中/連線中/重連中/逾時/已離線）
   - 非 `connected` 顯示明確警示文案：已暫停寫入，避免不一致資料

## 錯誤與行為定義

- 守門阻擋錯誤碼：`SYNC_NOT_CONNECTED_BLOCKED`
- 使用者可重試時機：狀態回到 `connected`
- 離線期間不做 optimistic write（避免本地狀態漂移）

## 驗證方式（手動）

1. 啟動前後端，確認狀態為 `connected`。
2. 關閉 backend，應切為 `disconnected/reconnecting/stale`。
3. 離線時嘗試新增/刪除資料，應被阻擋。
4. backend 恢復後應自動重連並完成 resync。
5. 再次寫入應恢復正常。

## 程式碼位置

- 連線生命週期：`packages/frontend/src/sync.ts`
- 同步狀態 store：`packages/frontend/src/stores/syncStatusStore.ts`
- 寫入守門策略：`packages/frontend/src/syncPolicy.ts`
- API 守門入口：`packages/frontend/src/client.ts`
- UI 狀態顯示：`packages/frontend/src/App.tsx`

## 建議單元測試（小規模）

- `syncPolicy`（純函式）
  - method 是否屬 mutation
  - bypass path（login/logout）判斷
  - 非 connected 是否阻擋 mutation
- `reconnect delay` 計算
  - 隨 attempt 增長且不超過上限
- `status transition`
  - `connecting -> connected -> stale/disconnected -> reconnecting -> connected`

## 已知取捨

- 目前採「安全優先」：非 connected 全面禁止 mutation。
- 成本是離線期間不可寫；優點是避免共編系統最難追的資料一致性事故。
- 後續可評估「離線佇列」模式，但需額外解衝突與重放設計。
