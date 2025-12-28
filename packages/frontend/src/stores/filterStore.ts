import { singulation } from "@frontend/utils/singulation";
import { addDays, startOfWeek } from "date-fns";
import { createSignal } from "solid-js";

export type Filter = {
  startDate: Date;
  endDate: Date;
  includeDoneTasks: boolean;
  projectIds?: string[];
  labelIds?: string[];
  personIds?: string[];
};

function createFilterStore() {
  const [filter, setFilter] = createSignal<Filter>({
    startDate: startOfWeek(new Date()),
    endDate: addDays(startOfWeek(new Date()), 14),
    includeDoneTasks: true,
  });

  function toCurrentWeek() {
    const today = new Date();
    setFilter({
      ...filter(),
      startDate: startOfWeek(today),
      endDate: addDays(startOfWeek(today), 14),
    });
  }

  function toPreviousWeek() {
    const { startDate, endDate } = filter();
    setFilter({
      ...filter(),
      startDate: addDays(startDate, -7),
      endDate: addDays(endDate, -7),
    });
  }

  function toNextWeek() {
    const { startDate, endDate } = filter();
    setFilter({
      ...filter(),
      startDate: addDays(startDate, 7),
      endDate: addDays(endDate, 7),
    });
  }

  function setIncludeDoneTasks(b: boolean) {
    setFilter({
      ...filter(),
      includeDoneTasks: b,
    });
  }

  function setProjectIds(projectIds?: string[]) {
    setFilter({
      ...filter(),
      projectIds,
    });
  }

  function setLabelIds(labelIds?: string[]) {
    setFilter({
      ...filter(),
      labelIds,
    });
  }

  function setPersonIds(personIds?: string[]) {
    setFilter({
      ...filter(),
      personIds,
    });
  }

  return {
    filter,
    setFilter,
    toCurrentWeek,
    toPreviousWeek,
    toNextWeek,
    setIncludeDoneTasks,
    setProjectIds,
    setLabelIds,
    setPersonIds,
  };
}

export const useFilterStore = singulation(createFilterStore);
