import { client } from "@frontend/client";
import { useDragController } from "@frontend/stores/DragController";
import { usePanelController } from "@frontend/stores/PanelController";
import { useHolidayStore } from "@frontend/stores/holidayStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { format } from "date-fns";
import { Show, createMemo } from "solid-js";

import type { Milestone } from "@backend/schemas/Milestone";

export function MilestoneBlock(props: {
  class?: string;
  milestone: Milestone;
  showProject?: boolean;
}) {
  const { pushPanel } = usePanelController();
  const { setDragContext, dragContext } = useDragController();
  const { getProject } = useProjectStore();
  const { getTask } = useTaskStore();
  const { getWorkDays } = useHolidayStore();
  const { milestone } = props;
  const project = createMemo(() => getProject(milestone.projectId));
  const workDays = createMemo(() => {
    if (!milestone.dueDate) return null;
    return getWorkDays(milestone.dueDate);
  });

  const baseClass =
    "p-1 border rounded text-sm shadow cursor-pointer select-none bg-yellow-50 border-yellow-400 hover:bg-yellow-100";
  const mergedClass = props.class ? `${baseClass} ${props.class}` : baseClass;
  return (
    <div
      class={mergedClass}
      onClick={() =>
        pushPanel({ type: "MILESTONE", milestoneId: milestone.id })
      }
      draggable="true"
      onDragStart={() =>
        setDragContext({ type: "MILESTONE", milestoneId: milestone.id })
      }
      onDrop={async (e) => {
        e.preventDefault();
        const currentDragContext = dragContext();
        if (currentDragContext?.type === "TASK") {
          const task = getTask(currentDragContext.taskId);
          if (!task || task.projectId !== milestone.projectId) {
            setDragContext(null);
            return;
          }
          await client.api
            .tasks({ id: currentDragContext.taskId })
            .patch({ milestoneId: milestone.id, dueDate: milestone.dueDate });
          setDragContext(null);
        }
      }}
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
            ? `${format(milestone.dueDate, "MM-dd")} (${workDays() === "overdue" ? "逾期" : `${workDays()}工作日`})`
            : ""}
        </span>
      </div>
    </div>
  );
}
