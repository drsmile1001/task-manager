import { client } from "@frontend/client";
import { singulation } from "@frontend/utils/singulation";
import { createStore } from "solid-js/store";

import type { SystemUser } from "@backend/public";

function createSystemUserStore() {
  const [map, setMap] = createStore(
    {} as Record<string, SystemUser | undefined>
  );

  async function loadSystemUsers() {
    const result = await client.api["system-users"].get();
    if (result.error) {
      throw new Error("Failed to load system users");
    }
    setMap(Object.fromEntries(result.data.map((user) => [user.id, user])));
  }
  loadSystemUsers();

  function getSystemUser(id: string): SystemUser | undefined {
    return map[id];
  }

  return {
    loadSystemUsers,
    getSystemUser,
  };
}

export const useSystemUserStore = singulation(createSystemUserStore);
