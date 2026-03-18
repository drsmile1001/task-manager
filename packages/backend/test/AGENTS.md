# packages/backend/test

## 總覽

後端測試：API 整合測試（`api.test.ts`）+ service 單元測試，全部使用 `bun:test`。

## 結構

```
test/
├── api.test.ts           # 主要 API 測試（describe("api", ...)）
├── fake/                 # 測試替身（所有 fake 統一放這）
│   ├── FakeRepositories.ts
│   ├── FakeRequesterResolver.ts
│   └── FakeMutationPublisher.ts
└── services/             # Service 單元測試
    ├── TaskAutoArchiveService.test.ts
    ├── MilestoneAutoArchiveService.test.ts
    └── ...
```

## createTestCtx 模式

```typescript
async function createTestCtx(options?: {
  requester?: Person;
  seed?: Parameters<typeof createFakeRepositories>[0];
}) {
  const requesterResolver = createFakeRequesterResolver(options?.requester);
  const mutationPublisher = new FakeMutationPublisher(logger);
  const fakeRepos = createFakeRepositories(options?.seed);
  const app = await buildApi({ logger, repos: fakeRepos.repos, mutationPublisher, requesterResolver });
  const api = treaty(app);
  return { api, requesterResolver, mutationPublisher, repos: fakeRepos.inspect };
}
```

每個 `describe` 區塊應有自己的 `createTestCtx`，不共用 state。

## FakeRepositories

`createFakeRepositories(seed?)` 建立帶 call tracking 的 in-memory repo：

```typescript
const { repos, inspect } = createFakeRepositories({
  tasks: [{ id: "t-1", ... }],
});
// inspect.taskRepo.calls.set → 所有 .set() 呼叫紀錄
// inspect.taskRepo.list() → 目前狀態
```

Fake 層負責 seed 資料、call 記錄、斷言輔助。`InMemoryRepo` 保持底層 helper，不在 test 中直接 new。

## FakeRequesterResolver

```typescript
const resolver = createFakeRequesterResolver(defaultRequester);
resolver.setRequester({ id: "other-user", ... }); // 切換 requester
resolver.resolveCalls.length; // 統計呼叫次數
```

## FakeMutationPublisher

收集所有廣播的 mutations 供斷言：
```typescript
mutationPublisher.mutations → AuditLog[]
```

## 反模式

- 不在 `test/helpers/InMemoryRepo.ts` 加業務邏輯，只放底層 helper
- 不共用 ctx 跨測試（每個 test 應獨立建立）
- 不在測試中讀取真實 YAML 檔案
