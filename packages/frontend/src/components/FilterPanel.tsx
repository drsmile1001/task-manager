import { filterStore } from "@frontend/stores/filterStore";
import { projectStore } from "@frontend/stores/projectStore";
import { For } from "solid-js";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type FilterPanelProps = {
  onClose: () => void;
};

export default function FilterPanel(props: FilterPanelProps) {
  function clearFilter() {
    filterStore.setFilter({
      ...filterStore.filter(),
      projectId: undefined,
      includeDoneTasks: true,
    });
  }
  return (
    <DetailPanel title="篩選" onClose={props.onClose}>
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label class="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filterStore.filter().includeDoneTasks}
              onInput={(e) =>
                filterStore.setIncludeDoneTasks(e.currentTarget.checked)
              }
            />
            <span>已完成</span>
          </label>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">所屬專案</label>
          <select
            class="border w-full px-2 py-1 rounded"
            value={filterStore.filter().projectId ?? ""}
            onInput={(e) =>
              filterStore.setProjectId(
                e.currentTarget.value === "" ? undefined : e.currentTarget.value
              )
            }
          >
            <option value="">全部專案</option>
            <For each={projectStore.projects()}>
              {(p) => <option value={p.id}>{p.name}</option>}
            </For>
          </select>
        </div>
        <Button onclick={clearFilter}>清除篩選</Button>
      </div>
    </DetailPanel>
  );
}
