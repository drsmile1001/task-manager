import type { YamlRepo } from "@backend/utils/YamlRepo";

export function createInMemoryRepo<T extends { id: string }>(
  initialData: T[]
): YamlRepo<T> & { data: T[] } {
  const state = {
    data: [...initialData],
  };
  return {
    data: state.data,
    async init() {},
    list() {
      return [...state.data];
    },
    get(id: string) {
      return state.data.find((item) => item.id === id);
    },
    async set(item: T) {
      const index = state.data.findIndex((existing) => existing.id === item.id);
      if (index >= 0) {
        state.data[index] = item;
      } else {
        state.data.push(item);
      }
    },
    async remove(id: string) {
      state.data = state.data.filter((item) => item.id !== id);
    },
    async replaceAll(data: T[]) {
      state.data = [...data];
    },
  };
}
