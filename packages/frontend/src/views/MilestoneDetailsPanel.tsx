import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Input from "@frontend/components/Input";
import Panel, { PanelSections, SectionLabel } from "@frontend/components/Panel";
import { Textarea } from "@frontend/components/Textarea";
import { usePanelController } from "@frontend/stores/detailPanelController";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { format, parse } from "date-fns";
import { onMount } from "solid-js";

export type MilestoneDetailsPanelProps = {
  milestoneId: string;
};

export default function MilestoneDetailsPanel(
  props: MilestoneDetailsPanelProps
) {
  const { popPanel } = usePanelController();
  const milestone = () => useMilestoneStore().getMilestone(props.milestoneId);
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
    <Panel title={`里程碑詳情 - ${milestone()?.name || ""}`}>
      <PanelSections>
        <SectionLabel>所屬專案</SectionLabel>
        <Input value={project()?.name || ""} disabled />
        <SectionLabel>名稱</SectionLabel>
        <Input
          ref={nameInputRef}
          value={milestone()?.name}
          onBlur={(e) => handleUpdateName(e.currentTarget.value)}
        />
        <SectionLabel>到期日</SectionLabel>
        <Input
          type="date"
          value={
            milestone()?.dueDate
              ? format(milestone()!.dueDate!, "yyyy-MM-dd")
              : ""
          }
          onBlur={(e) => handleUpdateDueDate(e.currentTarget.value)}
          placeholder="到期日 (可選)"
        />
        <SectionLabel>描述</SectionLabel>
        <Textarea
          value={milestone()?.description}
          onBlur={(e) => handleUpdateDescription(e.currentTarget.value)}
        />
        <SectionLabel>進階操作</SectionLabel>
        <div class="flex gap-2">
          <Button variant="danger" onclick={removeMilestone}>
            刪除
          </Button>
        </div>
      </PanelSections>
    </Panel>
  );
}
