import { singulation } from "@frontend/utils/singulation";
import { createStore } from "solid-js/store";

export type SharedFilter = {
  includeDoneTasks: boolean;
  includeArchivedTasks: boolean;
  projectIds: string[];
  labelIds: string[];
  personIds: string[];
  milestoneIds: string[];
};

function createSharedFilterStore() {
  const [sharedFilter, setSharedFilter] = createStore<SharedFilter>({
    includeDoneTasks: true,
    includeArchivedTasks: false,
    projectIds: [],
    labelIds: [],
    personIds: [],
    milestoneIds: [],
  });

  return {
    sharedFilter,
    setSharedFilter,
  };
}

export const useSharedFilterStore = singulation(createSharedFilterStore);
