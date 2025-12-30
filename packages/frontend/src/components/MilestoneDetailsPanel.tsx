import { client } from "@frontend/client";
import { usePanelController } from "@frontend/stores/detailPanelController";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { format, parse } from "date-fns";
import { createMemo, onMount } from "solid-js";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type MilestoneDetailsPanelProps = {
  milestoneId: string;
};

export default function MilestoneDetailsPanel(
  props: MilestoneDetailsPanelProps
) {
  const { popPanel } = usePanelController();
  const milestone = createMemo(() =>
    useMilestoneStore().getMilestone(props.milestoneId)
  );
  const project = () =>
    useProjectStore().getProject(milestone()?.projectId ?? "");
  let nameInputRef: HTMLInputElement | undefined;

  onMount(() => {
    nameInputRef?.focus();
  });

  const removeMilestone = async () => {
    await client.api.milestones({ id: props.milestoneId }).delete();
    popPanel();
  };

  function handleUpdateName(name: string) {
    client.api.milestones({ id: props.milestoneId }).patch({
      name,
    });
  }

  function handleUpdateDescription(description: string) {
    client.api.milestones({ id: props.milestoneId }).patch({
      description,
    });
  }

  function handleUpdateDueDate(dueDate: string) {
    client.api.milestones({ id: props.milestoneId }).patch({
      dueDate: dueDate ? parse(dueDate, "yyyy-MM-dd", new Date()) : null,
    });
  }

  return (
    <DetailPanel title={`里程碑詳情 - ${milestone()?.name || ""}`}>
      <div class="flex flex-col gap-4 p-2">
        <div>
          <label class="block text-sm font-medium mb-1">所屬專案</label>
          <input
            class="border w-full px-2 py-1 rounded bg-gray-100"
            value={project()?.name || ""}
            disabled
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">名稱</label>
          <input
            ref={nameInputRef}
            class="border w-full px-2 py-1 rounded"
            value={milestone()?.name}
            onBlur={(e) => handleUpdateName(e.currentTarget.value)}
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">到期日</label>
          <input
            class="border w-full px-2 py-1 rounded"
            type="date"
            value={
              milestone()?.dueDate
                ? format(milestone()!.dueDate!, "yyyy-MM-dd")
                : ""
            }
            onBlur={(e) => handleUpdateDueDate(e.currentTarget.value)}
            placeholder="到期日 (可選)"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">描述</label>
          <textarea
            class="border w-full px-2 py-1 rounded h-32"
            value={milestone()?.description}
            onBlur={(e) => handleUpdateDescription(e.currentTarget.value)}
          />
        </div>
        <div class="flex items-center gap-2">
          <Button variant="danger" onclick={removeMilestone}>
            刪除
          </Button>
        </div>
      </div>
    </DetailPanel>
  );
}
