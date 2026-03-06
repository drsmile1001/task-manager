import { client } from "@frontend/client";
import { useDragController } from "@frontend/stores/DragController";
import { usePanelController } from "@frontend/stores/PanelController";
import { useHolidayStore } from "@frontend/stores/holidayStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { usePersonStore } from "@frontend/stores/personStore";
import type {
  TaskStatusLevel,
  TaskWithRelation,
} from "@frontend/stores/taskStore";
import { format } from "date-fns";
import { For, Show, createMemo } from "solid-js";

import LabelLine from "./LabelLine";

type TaskColorMeta = Pick<
  TaskWithRelation,
  "statusLevel" | "hasActivePlannings"
>;

export const taskStatusColorClassMap: Record<TaskStatusLevel, string> = {
  archive: "bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-400",
  done: "bg-green-50 border-green-400 hover:bg-green-100",
  ongoing: "bg-blue-50 border-blue-400 hover:bg-blue-100",
  warn: "bg-yellow-50 border-yellow-400 hover:bg-yellow-100",
  danger: "bg-red-50 border-red-400 hover:bg-red-100",
};

export function getTaskColorClasses(task: TaskColorMeta | undefined) {
  if (!task) {
    return "";
  }
  const borderClass = task.hasActivePlannings ? " border-2" : "";
  return `${taskStatusColorClassMap[task.statusLevel]}${borderClass}`;
}

export function TaskBlock(props: {
  class?: string;
  task: TaskWithRelation;
  showProject?: boolean;
  showMilestone?: boolean;
}) {
  const { pushPanel } = usePanelController();
  const { setDragContext, dragContext } = useDragController();
  const { getPerson } = usePersonStore();
  const { getMilestone } = useMilestoneStore();
  const { getWorkDays } = useHolidayStore();

  const { task } = props;
  const workDays = createMemo(() => {
    if (!task.dueDate) return null;
    return getWorkDays(task.dueDate);
  });

  const baseClass =
    "p-1 border rounded text-sm shadow cursor-pointer select-none";
  const mergedClass = [baseClass, props.class, getTaskColorClasses(task)]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      class={mergedClass}
      onClick={() => pushPanel({ type: "TASK", taskId: task.id })}
      draggable="true"
      onDragStart={() =>
        setDragContext({
          type: "TASK",
          taskId: task.id,
        })
      }
      onDrop={async (e) => {
        e.preventDefault();
        const currentDragContext = dragContext();
        if (currentDragContext?.type === "MILESTONE") {
          const milestone = getMilestone(currentDragContext.milestoneId);
          if (!milestone || milestone.projectId !== task.projectId) {
            setDragContext(null);
            return;
          }
          await client.api
            .tasks({ id: task.id })
            .patch({ milestoneId: milestone.id, dueDate: milestone.dueDate });
          setDragContext(null);
        }
      }}
    >
      <div class="mb-1">
        <div class="flex justify-between items-center">
          <span
            classList={{
              "line-through": task.isDone,
            }}
          >
            {task.name}
          </span>
          <span>
            {task.dueDate
              ? `${format(task.dueDate, "MM-dd")} (${workDays() === "overdue" ? "逾期" : `${workDays()}工作日`})`
              : ""}
          </span>
        </div>
        <Show
          when={props.showProject || (props.showMilestone && task.milestone)}
        >
          <div class="flex justify-between items-center">
            <div class="pl-1 text-xs text-gray-500">
              {props.showProject ? task.project?.name : ""}
            </div>
            <div class="text-xs text-gray-500">
              {props.showMilestone ? task.milestone?.name : ""}
            </div>
          </div>
        </Show>
      </div>
      <div class="flex justify-between items-center">
        <div class="flex gap-1">
          <For each={task.assigneeIds}>
            {(assigneeId) => {
              const person = getPerson(assigneeId);
              if (!person) return null;
              return (
                <span class="px-1 py-0.5 rounded text-xs bg-gray-300 text-gray-800">
                  {person.name}
                </span>
              );
            }}
          </For>
        </div>
        <LabelLine labelIds={() => task.labelIds ?? []} />
      </div>
    </div>
  );
}
