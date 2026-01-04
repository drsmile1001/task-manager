import { singulation } from "@frontend/utils/singulation";
import { format, isAfter, startOfDay } from "date-fns";
import ky from "ky";
import { createStore } from "solid-js/store";

export type DateRecord = {
  date: string;
  isHoliday: boolean;
  description: string;
};

function createHolidayStore() {
  const loadingYears = new Map<string, Promise<void>>();
  const [map, setMap] = createStore<{ [key: string]: DateRecord | undefined }>(
    {}
  );

  async function load(date: string) {
    const year = date.slice(0, 4);
    if (loadingYears.has(year)) {
      await loadingYears.get(year);
      return;
    }
    const loadPromise = new Promise<void>(async (resolve) => {
      const fetchedRecord = await ky
        .get(
          `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`
        )
        .json<
          {
            date: string;
            isHoliday: boolean;
            description: string;
          }[]
        >();
      const records = fetchedRecord
        .map((fr) => ({
          date: `${fr.date.slice(0, 4)}-${fr.date.slice(4, 6)}-${fr.date.slice(6, 8)}`,
          isHoliday: fr.isHoliday,
          description: fr.description,
        }))
        .reduce(
          (acc, record) => {
            acc[record.date] = record;
            return acc;
          },
          {} as { [key: string]: DateRecord }
        );
      setMap(records);
      resolve();
    });
    loadingYears.set(year, loadPromise);
    await loadPromise;
  }

  function getDateRecord(date: string) {
    load(date);
    return map[date];
  }

  function getWorkDays(dueDate: string): "overdue" | number {
    const today = startOfDay(new Date());
    if (isAfter(today, dueDate)) return "overdue";
    let workDays = 0;
    let currentDate = today;
    while (!isAfter(currentDate, dueDate)) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const record = getDateRecord(dateStr);
      if (!record || !record.isHoliday) {
        workDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return workDays;
  }

  return {
    getDateRecord,
    getWorkDays,
  };
}

export const useHolidayStore = singulation(createHolidayStore);
