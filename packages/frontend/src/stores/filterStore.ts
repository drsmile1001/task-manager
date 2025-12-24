import { addDays, startOfWeek } from "date-fns";
import { createSignal } from "solid-js";

export type Filter = {
  startDate: Date;
  endDate: Date;
};

function createFilterStore() {
  const [filter, setFilter] = createSignal<Filter>({
    startDate: startOfWeek(new Date()),
    endDate: addDays(startOfWeek(new Date()), 14),
  });

  return {
    filter,
    setFilter,
  };
}

export const filterStore = createFilterStore();
