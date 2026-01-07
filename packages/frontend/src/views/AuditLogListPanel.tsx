import { AuditLogBlock } from "@frontend/components/AuditLogBlock";
import Panel, { PanelList } from "@frontend/components/Panel";
import { useAuditLogStore } from "@frontend/stores/auditLogStore";

export default function AuditLogListPanel() {
  const { logs } = useAuditLogStore();

  return (
    <Panel title="操作記錄">
      <PanelList items={() => logs}>
        {(log) => <AuditLogBlock log={log} link />}
      </PanelList>
    </Panel>
  );
}
