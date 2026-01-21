import { singulation } from "@frontend/utils/singulation";
import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";

export type Preference = {
  tableType: TableType;
  taskPoolGroupType: TaskPoolGroupType;
  byDayTableShowWeekPlans: boolean;
};
export type TableType = "BY_DAY" | "BY_WEEK";
const taskPoolGroupTypes = [
  "BY_PROJECT",
  "BY_PROJECT_MILESTONE",
  "BY_DUE_DATE",
] as const;
type TaskPoolGroupType = (typeof taskPoolGroupTypes)[number];

const defaultPreference: Preference = {
  tableType: "BY_DAY",
  taskPoolGroupType: "BY_DUE_DATE",
  byDayTableShowWeekPlans: true,
};

const key = "task-manager-preference";

function createPreferenceStore() {
  const localPreference = JSON.parse(
    localStorage.getItem(key) || "{}"
  ) as Partial<Preference>;
  const [preference, setPreference] = createStore({
    ...defaultPreference,
    ...localPreference,
  });

  createEffect(() => {
    localStorage.setItem(key, JSON.stringify(preference));
  });

  return {
    preference,
    setPreference,
  };
}
export const usePreferenceStore = singulation(createPreferenceStore);
