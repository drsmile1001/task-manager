import { client } from "@frontend/client";
import { useLabelStore } from "@frontend/stores/labelStore";
import { createEffect } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type FilterPanelProps = {
  onClose: () => void;
};

export default function LabelPanel(props: FilterPanelProps) {
  const labels = () => useLabelStore().labels();
  const nameInputRefs = new Map<string, HTMLInputElement>();
  let toFocusLabelId: string | null = null;

  async function createLabel() {
    const labelId = ulid();
    toFocusLabelId = labelId;
    await client.api.labels.post({
      id: labelId,
      name: "新標籤",
      color: "#777777",
      priority: null,
    });
  }

  createEffect(() => {
    labels();
    if (toFocusLabelId) {
      const inputRef = nameInputRefs.get(toFocusLabelId);
      if (inputRef) {
        inputRef.focus();
        toFocusLabelId = null;
      }
    }
  });

  function setLabelName(labelId: string, name: string) {
    client.api.labels({ id: labelId }).patch({
      name,
    });
  }

  function setLabelColor(labelId: string, color: string) {
    client.api.labels({ id: labelId }).patch({
      color,
    });
  }

  function setLabelPriority(labelId: string, priority: string | null) {
    const priorityNumber = priority ? parseInt(priority) : null;
    client.api.labels({ id: labelId }).patch({
      priority: priorityNumber,
    });
  }

  function hadleDeleteLabel(labelId: string) {
    client.api.labels({ id: labelId }).delete();
  }

  return (
    <DetailPanel title="標籤" onClose={props.onClose}>
      <div class="p-2 flex flex-col gap-4">
        {labels().map((label) => (
          <div class="flex items-center gap-2">
            <input
              ref={(el) => nameInputRefs.set(label.id, el)}
              class="border px-2 py-1 w-30 rounded"
              value={label.name}
              onBlur={(e) => setLabelName(label.id, e.currentTarget.value)}
              placeholder="標籤名稱"
            />
            <input
              class="rounded"
              type="color"
              value={label.color}
              onInput={(e) => setLabelColor(label.id, e.currentTarget.value)}
            />
            <input
              class="border px-2 py-1 w-30 rounded"
              type="number"
              min="1"
              value={label.priority ?? ""}
              onInput={(e) => setLabelPriority(label.id, e.currentTarget.value)}
              placeholder="優先順序"
            />
            <Button
              variant="danger"
              size="small"
              onClick={() => hadleDeleteLabel(label.id)}
            >
              刪除
            </Button>
          </div>
        ))}
        <div>
          <Button variant="secondary" onclick={createLabel}>
            新增
          </Button>
        </div>
      </div>
    </DetailPanel>
  );
}
