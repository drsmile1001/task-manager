import { client } from "@frontend/client";
import { perfEnd, perfStart } from "@frontend/utils/perf";
import { singulation } from "@frontend/utils/singulation";
import { createStore } from "solid-js/store";

import type { AuditLog } from "@backend/public";

function createAuditLogStore() {
  const [logs, setLogs] = createStore([] as AuditLog[]);

  async function loadAuditLogs() {
    const loadToken = perfStart("auditLogStore:load");
    const result = await client.api["audit-logs"].get();
    if (result.error) {
      perfEnd(loadToken, { error: true }, 1);
      throw new Error("Failed to load persons");
    }
    setLogs(result.data);
    perfEnd(loadToken, { count: result.data.length }, 1);
  }
  loadAuditLogs();

  function addAuditLog(log: AuditLog) {
    setLogs([log, ...logs]);
  }

  return {
    logs,
    addAuditLog,
  };
}

export const useAuditLogStore = singulation(createAuditLogStore);
