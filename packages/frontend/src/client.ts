import { treaty } from "@elysiajs/eden";
import { isSyncWritable } from "@frontend/stores/syncStatusStore";
import { shouldBlockMutationRequest } from "@frontend/syncPolicy";

import { type Api } from "@backend/public";

export const client = treaty<Api>(
  document.location.origin + import.meta.env.BASE_URL,
  {
    onRequest(path, options) {
      const pathname = new URL(path, document.location.origin).pathname;
      const method = (options.method ?? "GET").toUpperCase();
      if (
        shouldBlockMutationRequest({
          method,
          pathname,
          isSyncWritable: isSyncWritable(),
        })
      ) {
        throw new Error("SYNC_NOT_CONNECTED_BLOCKED");
      }
      return options;
    },
    onResponse(response: Response) {
      if (response.ok) return response.json();
    },
  }
);
