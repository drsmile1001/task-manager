import { useDragController } from "@frontend/stores/DragController";
import { usePanelController } from "@frontend/stores/PanelController";
import { useProjectStore } from "@frontend/stores/projectStore";
import { differenceInDays, format, startOfDay } from "date-fns";
import { Show, createMemo } from "solid-js";

import type { Milestone } from "@backend/schemas/Milestone";

export function MilestoneBlock(props: {
  class?: string;
  milestone: Milestone;
  showProject?: boolean;
}) {
  const { pushPanel } = usePanelController();
  const { setDragContext } = useDragController();
  const { getProject } = useProjectStore();
  const today = startOfDay(new Date());
  const { milestone } = props;
  const project = createMemo(() => getProject(milestone.projectId));
  const dayDiff = () =>
    milestone.dueDate
      ? differenceInDays(new Date(milestone.dueDate), today)
      : null;
  const baseClass =
    "p-1 border rounded text-sm shadow cursor-pointer select-none bg-yellow-50 border-yellow-400 hover:bg-yellow-100";
  const mergedClass = props.class ? `${baseClass} ${props.class}` : baseClass;
  return (
    <div
      class={mergedClass}
      onClick={() =>
        pushPanel({ type: "Milestone", milestoneId: milestone.id })
      }
      draggable="true"
      onDragStart={() =>
        setDragContext({ type: "milestone", milestoneId: milestone.id })
      }
    >
      <div class="flex justify-between items-center mb-1">
        <div>
          <Show when={props.showProject}>
            <span>{project()?.name}:</span>
          </Show>
          <span>{milestone.name}</span>
        </div>

        <span>
          {milestone.dueDate
            ? `${format(milestone.dueDate, "MM-dd")} (${dayDiff()})`
            : ""}
        </span>
      </div>
    </div>
  );
}
