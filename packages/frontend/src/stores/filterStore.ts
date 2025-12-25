import { addDays, startOfWeek } from "date-fns";
import { createSignal } from "solid-js";

export type Filter = {
  startDate: Date;
  endDate: Date;
  includeDoneTasks: boolean;
  projectId?: string;
  labelIds?: string[];
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

  function setProjectId(projectId?: string) {
    setFilter({
      ...filter(),
      projectId,
    });
  }

  function setLabelIds(labelIds?: string[]) {
    setFilter({
      ...filter(),
      labelIds,
    });
  }

  return {
    filter,
    setFilter,
    toCurrentWeek,
    toPreviousWeek,
    toNextWeek,
    setIncludeDoneTasks,
    setProjectId,
    setLabelIds,
  };
}

export const filterStore = createFilterStore();
