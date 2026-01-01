import { useDragController } from "@frontend/stores/DragController";
import { usePanelController } from "@frontend/stores/PanelController";
import { useAssignmentStore } from "@frontend/stores/assignmentStore";
import { usePersonStore } from "@frontend/stores/personStore";
import type { TaskWithRelation } from "@frontend/stores/taskStore";
import { differenceInDays, format, isBefore, startOfDay } from "date-fns";
import { For, Show } from "solid-js";

import LabelLine from "./LabelLine";

export function TaskBlock(props: {
  class?: string;
  task: TaskWithRelation;
  showProject?: boolean;
}) {
  const { pushPanel } = usePanelController();
  const { startTaskDrag } = useDragController();
  const { getPerson } = usePersonStore();
  const today = startOfDay(new Date());
  const { task } = props;
  const assigned = () => useAssignmentStore().listByTask(task.id).length > 0;
  const isArchived = () => task.isArchived || task.project?.isArchived;
  const isOverdue = () =>
    task.dueDate ? isBefore(task.dueDate, today) : false;
  const dayDiff = () =>
    task.dueDate ? differenceInDays(new Date(task.dueDate), today) : null;
  const baseClass =
    "p-1 border rounded text-sm shadow cursor-pointer select-none";
  const mergedClass = props.class ? `${baseClass} ${props.class}` : baseClass;
  return (
    <div
      class={mergedClass}
      classList={{
        "bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-400":
          isArchived(),
        "bg-red-50 border-red-400 hover:bg-red-100":
          !isArchived() && isOverdue(),
        "bg-green-50 border-green-400 hover:bg-green-100":
          !isArchived() && !isOverdue() && assigned(),
        "bg-yellow-50 border-yellow-400 hover:bg-yellow-100":
          !isArchived() && !isOverdue() && !assigned(),
        "line-through": task.isDone,
      }}
      onClick={() => pushPanel({ type: "Task", taskId: task.id })}
      draggable="true"
      onDragStart={() => startTaskDrag(task.id)}
    >
      <div class="flex justify-between items-center mb-1">
        <div>
          <Show when={props.showProject}>
            <span>{task.project?.name}:</span>
          </Show>
          <span>{task.name}</span>
        </div>

        <span>
          {task.dueDate
            ? `${format(task.dueDate, "MM-dd")} (${dayDiff()})`
            : ""}
        </span>
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
