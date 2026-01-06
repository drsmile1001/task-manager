import Panel, { PanelList } from "@frontend/components/Panel";
import { usePanelController } from "@frontend/stores/PanelController";
import { useAuditLogStore } from "@frontend/stores/auditLogStore";
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

export default function AuditLogListPanel() {
  const { logs } = useAuditLogStore();
  const { getPerson } = usePersonStore();
  const { pushPanel } = usePanelController();
  const { getProject } = useProjectStore();
  const { getMilestone } = useMilestoneStore();
  const { getLabel } = useLabelStore();
  const { getTaskWithRelation } = useTaskStore();

  function getActionLabel(action: ActionType) {
    switch (action) {
      case "CREATE":
        return "建立";
      case "UPDATE":
        return "更新";
      case "DELETE":
        return "刪除";
      default:
        return "";
    }
  }

  function getEntityTypeLabel(entityType: EntityType) {
    switch (entityType) {
      case "PERSON":
        return "人員";
      case "LABEL":
        return "標籤";
      case "PROJECT":
        return "專案";
      case "MILESTONE":
        return "里程碑";
      case "TASK":
        return "工作";
      case "PLANNING":
        return "計劃";
      case "ASSIGNMENT":
        return "指派";
      default:
        return "";
    }
  }

  function personToRecord(person: Person | undefined) {
    return {
      姓名: person?.name || "<空>",
      Email: person?.email || "<空>",
      順序: person?.order?.toString() || "<空>",
    };
  }

  function labelToRecord(label: Label | undefined) {
    return {
      名稱: label?.name || "<空>",
      顏色: label?.color || "<空>",
      優先: label?.priority?.toString() || "<空>",
    };
  }

  function projectToRecord(project: Project | undefined) {
    return {
      名稱: project?.name || "<空>",
      描述: project?.description || "<空>",
      順序: project?.order?.toString() || "<空>",
      封存: project?.isArchived ? "是" : "否",
    };
  }

  function milestoneToRecord(milestone: Milestone | undefined) {
    return {
      專案: getProject(milestone?.projectId || "")?.name || "<空>",
      名稱: milestone?.name || "<空>",
      描述: milestone?.description || "<空>",
      到期日:
        (milestone?.dueDate as Date | undefined)?.toISOString().split("T")[0] ||
        "<空>",
      封存: milestone?.isArchived ? "是" : "否",
    };
  }

  function taskToRecord(task: Task | undefined) {
    return {
      專案: getProject(task?.projectId || "")?.name || "<空>",
      里程碑: getMilestone(task?.milestoneId || "")?.name || "<空>",
      名稱: task?.name || "<空>",
      描述: task?.description || "<空>",
      到期日:
        (task?.dueDate as Date | undefined)?.toISOString().split("T")[0] ||
        "<空>",
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
    };
  }

  function planningToRecord(planning: Planning | undefined) {
    return {
      專案:
        getTaskWithRelation(planning?.taskId || "")?.project?.name || "<空>",
      工作: getTaskWithRelation(planning?.taskId || "")?.name || "<空>",
      週:
        (planning?.weekStartDate as Date | undefined)
          ?.toISOString()
          .split("T")[0] || "<空>",
    };
  }

  function assignmentToRecord(assignment: Assignment | undefined) {
    return {
      專案:
        getTaskWithRelation(assignment?.taskId || "")?.project?.name || "<空>",
      工作: getTaskWithRelation(assignment?.taskId || "")?.name || "<空>",
      人員: getPerson(assignment?.personId || "")?.name || "<空>",
      日期:
        (assignment?.date as Date | undefined)?.toISOString().split("T")[0] ||
        "<空>",
      備註: assignment?.note || "<空>",
    };
  }

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
        diff[key] = `${beforeValue} => ${afterValue}`;
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

  function changeSummary(log: AuditLog): string {
    switch (log.entityType) {
      case "PERSON":
        return toSummaryText(log, personToRecord, ["姓名"]);
      case "LABEL":
        return toSummaryText(log, labelToRecord, ["名稱"]);
      case "PROJECT":
        return toSummaryText(log, projectToRecord, ["名稱"]);
      case "MILESTONE":
        return toSummaryText(log, milestoneToRecord, ["專案", "名稱"]);
      case "TASK":
        return toSummaryText(log, taskToRecord, ["專案", "名稱"]);
      case "PLANNING":
        return toSummaryText(log, planningToRecord, ["專案", "工作"]);
      case "ASSIGNMENT":
        return toSummaryText(log, assignmentToRecord, [
          "專案",
          "工作",
          "人員",
          "日期",
        ]);
      default:
        return "";
    }
  }

  return (
    <Panel title="操作記錄">
      <PanelList items={() => logs}>
        {(log) => (
          <div class="w-full felx flex-col gap-1">
            <div
              class="px-1 rounded-md mb-1 text-sm flex gap-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
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
                      taskId:
                        log.changes.after?.taskId ?? log.changes.before?.taskId,
                    });
                    break;
                  default:
                    break;
                }
              }}
            >
              <div>{format(log.timestamp, "yyyy-MM-dd HH:mm:ss")}</div>
              <div>{getPerson(log.userId)?.name}</div>
              <div>{getActionLabel(log.action)}</div>
              <div>{getEntityTypeLabel(log.entityType)}</div>
            </div>
            <pre class="ml-2 bg-gray-100 px-2 py-1 rounded-md text-xs">
              {changeSummary(log)}
            </pre>
          </div>
        )}
      </PanelList>
    </Panel>
  );
}
