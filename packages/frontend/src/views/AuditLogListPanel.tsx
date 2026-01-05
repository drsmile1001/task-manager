import Panel, { PanelList } from "@frontend/components/Panel";
import { usePanelController } from "@frontend/stores/PanelController";
import { useAuditLogStore } from "@frontend/stores/auditLogStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { format } from "date-fns";
import { stringify } from "yaml";

import type { ActionType, EntityType } from "@backend/schemas/AuditLog";

export default function AuditLogListPanel() {
  const { logs } = useAuditLogStore();
  const { getPerson } = usePersonStore();
  const { pushPanel } = usePanelController();

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

  return (
    <Panel title="操作記錄">
      <PanelList items={() => logs}>
        {(log) => (
          <div class="w-full">
            <div
              class="flex gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md"
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
            <pre class="h-20 overflow-auto bg-gray-100 p-2 rounded-md text-sm">
              {stringify(log.changes)}
            </pre>
          </div>
        )}
      </PanelList>
    </Panel>
  );
}
