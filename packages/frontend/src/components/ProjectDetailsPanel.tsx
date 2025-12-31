import { client } from "@frontend/client";
import { usePanelController } from "@frontend/stores/detailPanelController";
import { useFilterStore } from "@frontend/stores/filterStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { format, parse } from "date-fns";
import { Show, onMount } from "solid-js";
import { ulid } from "ulid";

import type { Milestone } from "@backend/schemas/Milestone";

import Button from "./Button";
import DetailPanel, {
  PanelList,
  PanelSections,
  SectionLabel,
} from "./DetailPanel";
import Input from "./Input";
import { Textarea } from "./Textarea";

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

  const { setProjectIds } = useFilterStore();

  function applyFilter() {
    setProjectIds([props.projectId]);
    pushPanel({ type: "Filter" });
  }

  return (
    <DetailPanel
      title={`專案詳情 - ${project()?.name || ""}`}
      actions={
        <Button variant="secondary" size="small" onClick={applyFilter}>
          套用篩選
        </Button>
      }
    >
      <PanelSections>
        <SectionLabel>名稱</SectionLabel>
        <Input
          ref={nameInputRef}
          value={project()?.name}
          onBlur={(e) => handleUpdateName(e.currentTarget.value)}
        />
        <SectionLabel>描述</SectionLabel>
        <Textarea
          value={project()?.description}
          onBlur={(e) => handleUpdateDescription(e.currentTarget.value)}
        />
        <SectionLabel>排序</SectionLabel>
        <Input
          type="number"
          min="1"
          value={project()?.order ?? ""}
          onInput={(e) => handleUpdateOrder(e.currentTarget.value)}
          placeholder="排序 (可選)"
        />
        <SectionLabel>里程碑</SectionLabel>
        <PanelList items={milestones}>
          {(milestone) => (
            <>
              <Input
                class="flex-1"
                value={milestone.name}
                placeholder="名稱"
                onBlur={(e) =>
                  handleUpdateMileStone(milestone.id, {
                    name: e.currentTarget.value,
                  })
                }
              />
              <Input
                class="w-40"
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
                size="small"
                onClick={() =>
                  pushPanel({ type: "Milestone", milestoneId: milestone.id })
                }
              >
                詳細
              </Button>
            </>
          )}
        </PanelList>
        <div>
          <Button variant="secondary" onClick={createMilestone}>
            新增里程碑
          </Button>
        </div>
        <SectionLabel>進階操作</SectionLabel>
        <div class="flex gap-2">
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
      </PanelSections>
    </DetailPanel>
  );
}
