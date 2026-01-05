import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { createStore } from "solid-js/store";

import type { AuditLog } from "@backend/schemas/AuditLog";

function createAuditLogStore() {
  const [logs, setLogs] = createStore([] as AuditLog[]);

  async function loadAuditLogs() {
    const result = await client.api["audit-logs"].get();
    if (result.error) {
      throw new Error("Failed to load persons");
    }
    setLogs(result.data);
  }
  loadAuditLogs();

  return {
    logs,
    loadAuditLogs,
  };
}

export const useAuditLogStore = singulation(createAuditLogStore);
