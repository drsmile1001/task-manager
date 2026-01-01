import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Input from "@frontend/components/Input";
import Panel, { PanelList } from "@frontend/components/Panel";
import { useLabelStore } from "@frontend/stores/labelStore";
import { createEffect } from "solid-js";
import { ulid } from "ulid";

export default function LabelPanel() {
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
    <Panel
      title="標籤"
      actions={
        <div class="flex items-center justify-between">
          <div></div>
          <Button variant="secondary" size="small" onclick={createLabel}>
            + 新增
          </Button>
        </div>
      }
    >
      <PanelList items={labels}>
        {(label) => (
          <>
            <Input
              ref={(el) => nameInputRefs.set(label.id, el)}
              class="flex-1"
              value={label.name}
              onBlur={(e) => setLabelName(label.id, e.currentTarget.value)}
              placeholder="標籤名稱"
            />
            <Input
              class="w-10 cursor-pointer"
              type="color"
              value={label.color}
              onInput={(e) => setLabelColor(label.id, e.currentTarget.value)}
            />
            <Input
              class="w-20"
              type="number"
              min="1"
              value={label.priority ?? ""}
              onInput={(e) => setLabelPriority(label.id, e.currentTarget.value)}
              placeholder="優先"
            />
            <Button
              variant="danger"
              size="small"
              onClick={() => hadleDeleteLabel(label.id)}
            >
              刪除
            </Button>
          </>
        )}
      </PanelList>
    </Panel>
  );
}
