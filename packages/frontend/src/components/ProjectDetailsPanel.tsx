import { client } from "@frontend/client";
import { usePanelController } from "@frontend/stores/detailPanelController";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { format, parse } from "date-fns";
import { Show, createEffect, onMount } from "solid-js";
import { ulid } from "ulid";

import type { Milestone } from "@backend/schemas/Milestone";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type ProjectDetailsPanelProps = {
  projectId: string;
};

export default function ProjectDetailsPanel(props: ProjectDetailsPanelProps) {
  const { popPanel, pushPanel } = usePanelController();
  const project = () => useProjectStore().getProject(props.projectId);
  let nameInputRef: HTMLInputElement | undefined;

  onMount(() => {
    nameInputRef?.focus();
  });

  const removeProject = async () => {
    await client.api.projects({ id: props.projectId }).delete();
    popPanel();
  };

  const setProjectIsArchived = async (isArchived: boolean) => {
    await client.api.projects({ id: props.projectId }).patch({
      isArchived,
    });
  };

  function handleUpdateName(name: string) {
    client.api.projects({ id: props.projectId }).patch({
      name,
    });
  }

  function handleUpdateDescription(description: string) {
    client.api.projects({ id: props.projectId }).patch({
      description,
    });
  }

  function handleUpdateOrder(order: string) {
    const orderNumber = order ? parseInt(order) : null;
    client.api.projects({ id: props.projectId }).patch({
      order: orderNumber,
    });
  }

  const { getMilestonesByProjectId } = useMilestoneStore();

  async function createMilestone() {
    await client.api.milestones.post({
      id: ulid(),
      projectId: props.projectId,
      name: "新里程碑",
      dueDate: null,
      description: "",
    });
  }

  async function handleUpdateMileStone(
    milestoneId: string,
    updating: Partial<Milestone>
  ) {
    await client.api.milestones({ id: milestoneId }).patch(updating);
  }

  const milestones = () => getMilestonesByProjectId(props.projectId);

  return (
    <DetailPanel title={`專案詳情 - ${project()?.name || ""}`}>
      <div class="flex flex-col gap-4 p-2">
        <div>
          <label class="block text-sm font-medium mb-1">名稱</label>
          <input
            ref={nameInputRef}
            class="border w-full px-2 py-1 rounded"
            value={project()?.name}
            onBlur={(e) => handleUpdateName(e.currentTarget.value)}
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">描述</label>
          <textarea
            class="border w-full px-2 py-1 rounded h-32"
            value={project()?.description}
            onBlur={(e) => handleUpdateDescription(e.currentTarget.value)}
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">排序</label>
          <input
            class="border w-full px-2 py-1 rounded"
            type="number"
            min="1"
            value={project()?.order ?? ""}
            onInput={(e) => handleUpdateOrder(e.currentTarget.value)}
            placeholder="排序 (可選)"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">里程碑</label>
          <div class="flex flex-col gap-2 p-2">
            {milestones().map((milestone) => (
              <div class="flex gap-2">
                <input
                  class="border w-40 px-2 py-1 rounded"
                  type="text"
                  value={milestone.name}
                  placeholder="名稱"
                  onBlur={(e) =>
                    handleUpdateMileStone(milestone.id, {
                      name: e.currentTarget.value,
                    })
                  }
                />
                <input
                  class="border w-40 px-2 py-1 rounded"
                  type="date"
                  value={
                    milestone.dueDate
                      ? format(milestone.dueDate, "yyyy-MM-dd")
                      : ""
                  }
                  placeholder="截止日期"
                  onBlur={(e) =>
                    handleUpdateMileStone(milestone.id, {
                      dueDate: e.currentTarget.value
                        ? parse(e.currentTarget.value, "yyyy-MM-dd", new Date())
                        : null,
                    })
                  }
                />
                <Button
                  variant="secondary"
                  onClick={() =>
                    pushPanel({ type: "Milestone", milestoneId: milestone.id })
                  }
                >
                  詳細
                </Button>
              </div>
            ))}

            <div>
              <Button variant="secondary" onClick={createMilestone}>
                新增里程碑
              </Button>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            onclick={() => setProjectIsArchived(!project()?.isArchived)}
          >
            {project()?.isArchived ? "還原" : "封存"}
          </Button>
          <Show when={project()?.isArchived}>
            <Button variant="danger" onclick={removeProject}>
              刪除
            </Button>
          </Show>
        </div>
      </div>
    </DetailPanel>
  );
}
