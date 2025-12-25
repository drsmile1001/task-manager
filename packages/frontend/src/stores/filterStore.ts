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

  function toCurrentWeek() {
    const today = new Date();
    setFilter({
      startDate: startOfWeek(today),
      endDate: addDays(startOfWeek(today), 14),
    });
  }

  function toPreviousWeek() {
    const { startDate, endDate } = filter();
    setFilter({
      startDate: addDays(startDate, -7),
      endDate: addDays(endDate, -7),
    });
  }

  function toNextWeek() {
    const { startDate, endDate } = filter();
    setFilter({
      startDate: addDays(startDate, 7),
      endDate: addDays(endDate, 7),
    });
  }

  return {
    filter,
    setFilter,
    toCurrentWeek,
    toPreviousWeek,
    toNextWeek,
  };
}

export const filterStore = createFilterStore();
