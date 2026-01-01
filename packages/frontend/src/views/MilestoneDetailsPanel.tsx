import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Input from "@frontend/components/Input";
import Panel, { PanelSections, SectionLabel } from "@frontend/components/Panel";
import { Textarea } from "@frontend/components/Textarea";
import { usePanelController } from "@frontend/stores/PanelController";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { format, parse } from "date-fns";
import { debounce } from "lodash";
import { onMount } from "solid-js";

import type { Milestone } from "@backend/schemas/Milestone";

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

  function handleUpdateMilestone(update: Partial<Milestone>) {
    client.api.milestones({ id: props.milestoneId }).patch(update);
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
          onInput={debounce(
            (e) => handleUpdateMilestone({ name: e.currentTarget.value }),
            300
          )}
        />
        <SectionLabel>到期日</SectionLabel>
        <Input
          type="date"
          value={
            milestone()?.dueDate
              ? format(milestone()!.dueDate!, "yyyy-MM-dd")
              : ""
          }
          onInput={(e) => {
            const value = e.currentTarget.value;
            handleUpdateMilestone({
              dueDate: value ? parse(value, "yyyy-MM-dd", new Date()) : null,
            });
          }}
          placeholder="到期日 (可選)"
        />
        <SectionLabel>描述</SectionLabel>
        <Textarea
          value={milestone()?.description}
          onInput={debounce(
            (e) =>
              handleUpdateMilestone({ description: e.currentTarget.value }),
            300
          )}
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
