import { usePanelController } from "@frontend/stores/PanelController";
import { useLabelStore } from "@frontend/stores/labelStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { useTaskStore } from "@frontend/stores/taskStore";
import { format } from "date-fns";

import type { Assignment } from "@backend/schemas/Assignment";
import type {
  ActionType,
  AuditLog,
  EntityType,
} from "@backend/schemas/AuditLog";
import type { Label } from "@backend/schemas/Label";
import type { Milestone } from "@backend/schemas/Milestone";
import type { Person } from "@backend/schemas/Person";
import type { Planning } from "@backend/schemas/Planning";
import type { Project } from "@backend/schemas/Project";
import type { Task } from "@backend/schemas/Task";

const actionLabel: Record<ActionType, string> = {
  CREATE: "建立",
  UPDATE: "更新",
  DELETE: "刪除",
};

function recordToText(record: Record<string, any>): string {
  return Object.entries(record)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function toDiffText<T extends object>(
  before: T,
  after: T,
  idFields: string[] = []
): string {
  const diff: Record<string, string> = {};
  for (const [key, afterValue] of Object.entries(after)) {
    const beforeValue = (before as any)[key];
    if (afterValue !== beforeValue) {
      if (afterValue.includes("\n") || beforeValue.includes("\n")) {
        diff[key] =
          `\n--- 變更前 ---\n${beforeValue}\n--- 變更後 ---\n${afterValue}`;
      } else diff[key] = `${beforeValue} => ${afterValue}`;
    } else if (idFields.includes(key)) {
      diff[key] = `${beforeValue}`;
    }
  }
  return recordToText(diff);
}

function toSummaryText(
  log: AuditLog,
  toRecord: (obj: any) => Record<string, string>,
  idFields: string[] = []
): string {
  const beforeRecord = toRecord(log.changes.before);
  const afterRecord = toRecord(log.changes.after);
  if (log.action === "CREATE") {
    return recordToText(afterRecord);
  }
  if (log.action === "DELETE") {
    return recordToText(beforeRecord);
  }
  return toDiffText(beforeRecord, afterRecord, idFields);
}

export function AuditLogBlock(props: { log: AuditLog; link?: boolean }) {
  const { log } = props;
  const { getPerson } = usePersonStore();
  const { pushPanel } = usePanelController();
  const { getProject } = useProjectStore();
  const { getMilestone } = useMilestoneStore();
  const { getTaskWithRelation } = useTaskStore();
  const { getLabel } = useLabelStore();

  const entityTypeRenderers: Record<
    EntityType,
    {
      name: string;
      toRecord: (obj: any) => Record<string, string>;
      idFields: string[];
    }
  > = {
    PERSON: {
      name: "人員",
      toRecord: (person: Person | undefined) => ({
        姓名: person?.name || "<空>",
        Email: person?.email || "<空>",
        順序: person?.order?.toString() || "<空>",
      }),
      idFields: ["姓名"],
    },
    LABEL: {
      name: "標籤",
      toRecord: (label: Label | undefined) => ({
        名稱: label?.name || "<空>",
        顏色: label?.color || "<空>",
        優先: label?.priority?.toString() || "<空>",
      }),
      idFields: ["名稱"],
    },
    PROJECT: {
      name: "專案",
      toRecord: (project: Project | undefined) => ({
        名稱: project?.name || "<空>",
        描述: project?.description || "<空>",
        順序: project?.order?.toString() || "<空>",
        封存: project?.isArchived ? "是" : "否",
      }),
      idFields: ["名稱"],
    },
    MILESTONE: {
      name: "里程碑",
      toRecord: (milestone: Milestone | undefined) => ({
        專案: getProject(milestone?.projectId || "")?.name || "<空>",
        名稱: milestone?.name || "<空>",
        描述: milestone?.description || "<空>",
        到期日: milestone?.dueDate || "<空>",
        封存: milestone?.isArchived ? "是" : "否",
      }),
      idFields: ["專案", "名稱"],
    },
    TASK: {
      name: "工作",
      toRecord: (task: Task | undefined) => ({
        專案: getProject(task?.projectId || "")?.name || "<空>",
        里程碑: getMilestone(task?.milestoneId || "")?.name || "<空>",
        名稱: task?.name || "<空>",
        描述: task?.description || "<空>",
        到期日: task?.dueDate || "<空>",
        完成: task?.isDone ? "是" : "否",
        封存: task?.isArchived ? "是" : "否",
        指派:
          (task?.assigneeIds || [])
            .map((id) => getPerson(id)?.name || "<未知人員>")
            .join(", ") || "<空>",
        標籤:
          (task?.labelIds || [])
            .map((id) => getLabel(id)?.name || "<未知標籤>")
            .join(", ") || "<空>",
      }),
      idFields: ["專案", "名稱"],
    },
    PLANNING: {
      name: "計劃",
      toRecord: (planning: Planning | undefined) => ({
        專案:
          getTaskWithRelation(planning?.taskId || "")?.project?.name || "<空>",
        工作: getTaskWithRelation(planning?.taskId || "")?.name || "<空>",
        週: planning?.weekStartDate || "<空>",
      }),
      idFields: ["專案", "工作"],
    },
    ASSIGNMENT: {
      name: "指派",
      toRecord: (assignment: Assignment | undefined) => ({
        專案:
          getTaskWithRelation(assignment?.taskId || "")?.project?.name ||
          "<空>",
        工作: getTaskWithRelation(assignment?.taskId || "")?.name || "<空>",
        人員: getPerson(assignment?.personId || "")?.name || "<空>",
        日期: assignment?.date || "<空>",
        備註: assignment?.note || "<空>",
      }),
      idFields: ["專案", "工作", "人員", "日期"],
    },
  };

  const matchedRenderer = entityTypeRenderers[log.entityType];

  return (
    <div class="w-full felx flex-col gap-1">
      <div
        class="px-1 rounded-md mb-1 text-sm flex gap-2"
        classList={{
          "cursor-pointer hover:bg-gray-100": props.link,
        }}
        onClick={() => {
          if (!props.link) return;
          switch (log.entityType) {
            case "LABEL":
              pushPanel({ type: "LABEL" });
              break;
            case "PERSON":
              pushPanel({
                type: "PERSON_DETAILS",
                personId: log.entityId,
              });
              break;
            case "PROJECT":
              pushPanel({
                type: "PROJECT_DETAILS",
                projectId: log.entityId,
              });
              break;
            case "MILESTONE":
              pushPanel({ type: "MILESTONE", milestoneId: log.entityId });
              break;
            case "TASK":
              pushPanel({ type: "TASK", taskId: log.entityId });
              break;
            case "PLANNING":
            case "ASSIGNMENT":
              pushPanel({
                type: "TASK",
                taskId: ((log.changes.after ?? log.changes.before) as Task).id,
              });
              break;
            default:
              break;
          }
        }}
      >
        <div>{format(log.timestamp, "yyyy-MM-dd HH:mm:ss")}</div>
        <div>{getPerson(log.userId)?.name}</div>
        <div>{actionLabel[log.action]}</div>
        <div>{matchedRenderer.name}</div>
      </div>
      <pre class="ml-2 bg-gray-100 px-2 py-1 rounded-md text-xs">
        {toSummaryText(log, matchedRenderer.toRecord, matchedRenderer.idFields)}
      </pre>
    </div>
  );
}
