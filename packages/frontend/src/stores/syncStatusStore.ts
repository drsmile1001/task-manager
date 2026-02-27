import { singulation } from "@frontend/utils/singulation";
import { createStore } from "solid-js/store";

export type SyncConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "stale";

function createSyncStatusStore() {
  const [state, setState] = createStore({
    connectionState: "connecting" as SyncConnectionState,
    reconnectAttempt: 0,
    lastMessageAt: null as number | null,
    lastPongAt: null as number | null,
    lastDisconnectReason: null as string | null,
  });

  function setConnecting() {
    setState("connectionState", "connecting");
    setState("lastDisconnectReason", null);
  }

  function setConnected() {
    const now = Date.now();
    setState("connectionState", "connected");
    setState("reconnectAttempt", 0);
    setState("lastDisconnectReason", null);
    setState("lastMessageAt", now);
    setState("lastPongAt", now);
  }

  function setReconnecting(attempt: number) {
    setState("connectionState", "reconnecting");
    setState("reconnectAttempt", attempt);
  }

  function setDisconnected(reason: string) {
    setState("connectionState", "disconnected");
    setState("lastDisconnectReason", reason);
  }

  function setStale() {
    setState("connectionState", "stale");
    setState("lastDisconnectReason", "pong_timeout");
  }

  function markMessage() {
    setState("lastMessageAt", Date.now());
  }

  function markPong() {
    const now = Date.now();
    setState("lastPongAt", now);
    setState("lastMessageAt", now);
  }

  function isWritable() {
    return state.connectionState === "connected";
  }

  return {
    state,
    setConnecting,
    setConnected,
    setReconnecting,
    setDisconnected,
    setStale,
    markMessage,
    markPong,
    isWritable,
  };
}

export const useSyncStatusStore = singulation(createSyncStatusStore);

export function isSyncWritable() {
  return useSyncStatusStore().isWritable();
}
