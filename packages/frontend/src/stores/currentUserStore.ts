import { singulation } from "@frontend/utils/singulation";
import { createStore } from "solid-js/store";

import type { Person } from "@backend/public";

function createCurrentUserStore() {
  const [currentUser, setCurrentUser] = createStore<Person>({
    id: "",
    name: "",
    email: "",
  });

  return {
    currentUser,
    setCurrentUser,
  };
}

export const useCurrentUserStore = singulation(createCurrentUserStore);
