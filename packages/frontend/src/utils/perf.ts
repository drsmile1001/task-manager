export type PerfMeta = Record<string, unknown>;

export type PerfRecord = {
  ts: string;
  name: string;
  durationMs: number;
  meta?: PerfMeta;
};

type PerfControl = {
  dump: () => PerfRecord[];
  clear: () => void;
  getRecords: () => PerfRecord[];
  summaryByName: () => {
    name: string;
    count: number;
    totalMs: number;
    avgMs: number;
    maxMs: number;
  }[];
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
};

type PerfToken = {
  name: string;
  startAt: number;
  enabled: boolean;
  baseMeta?: PerfMeta;
};

function now() {
  return performance.now();
}

const records: PerfRecord[] = [];

function getRuntimeOverride() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const value = window.localStorage.getItem("TM_PERF");
    if (value === "1") {
      return true;
    }
    if (value === "0") {
      return false;
    }
    return null;
  } catch {
    return null;
  }
}

function getEnvSwitch() {
  return import.meta.env.VITE_TM_PERF === "1";
}

export function isPerfEnabled() {
  if (!import.meta.env.DEV) {
    return false;
  }
  const runtimeOverride = getRuntimeOverride();
  if (runtimeOverride !== null) {
    return runtimeOverride;
  }
  return getEnvSwitch();
}

export function perfStart(name: string, baseMeta?: PerfMeta): PerfToken {
  return {
    name,
    startAt: now(),
    enabled: isPerfEnabled(),
    baseMeta,
  };
}

export function perfEnd(
  token: PerfToken,
  meta?: PerfMeta,
  minDurationMs: number = 0
) {
  const durationMs = now() - token.startAt;
  if (!token.enabled || durationMs < minDurationMs) {
    return durationMs;
  }
  const mergedMeta = {
    ...(token.baseMeta ?? {}),
    ...(meta ?? {}),
  };
  records.push({
    ts: new Date().toISOString(),
    name: token.name,
    durationMs,
    meta: mergedMeta,
  });
  console.info(`[perf] ${token.name} ${durationMs.toFixed(2)}ms`, mergedMeta);
  return durationMs;
}

export async function perfMeasureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  baseMeta?: PerfMeta,
  minDurationMs: number = 0
) {
  const token = perfStart(name, baseMeta);
  try {
    return await fn();
  } finally {
    perfEnd(token, undefined, minDurationMs);
  }
}

function summaryByName() {
  const groupMap = new Map<
    string,
    { count: number; totalMs: number; maxMs: number }
  >();
  for (const record of records) {
    const current = groupMap.get(record.name);
    if (!current) {
      groupMap.set(record.name, {
        count: 1,
        totalMs: record.durationMs,
        maxMs: record.durationMs,
      });
      continue;
    }
    current.count += 1;
    current.totalMs += record.durationMs;
    current.maxMs = Math.max(current.maxMs, record.durationMs);
  }

  return [...groupMap.entries()]
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      totalMs: Number(stats.totalMs.toFixed(2)),
      avgMs: Number((stats.totalMs / stats.count).toFixed(2)),
      maxMs: Number(stats.maxMs.toFixed(2)),
    }))
    .sort((a, b) => b.totalMs - a.totalMs);
}

function attachPerfControl() {
  if (typeof window === "undefined") {
    return;
  }
  const perfControl: PerfControl = {
    dump() {
      console.table(records);
      return [...records];
    },
    clear() {
      records.length = 0;
    },
    getRecords() {
      return [...records];
    },
    summaryByName,
    enable() {
      window.localStorage.setItem("TM_PERF", "1");
    },
    disable() {
      window.localStorage.setItem("TM_PERF", "0");
    },
    isEnabled: isPerfEnabled,
  };
  window.__TM_PERF__ = perfControl;
}

attachPerfControl();

declare global {
  interface Window {
    __TM_PERF__?: PerfControl;
  }
}
