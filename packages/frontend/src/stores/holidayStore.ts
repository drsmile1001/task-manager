import { singulation } from "@frontend/utils/singulation";
import { parse } from "date-fns";
import ky from "ky";
import { createStore } from "solid-js/store";

export type DateRecord = {
  date: Date;
  isHoliday: boolean;
  description: string;
};

function createHolidayStore() {
  const loadingYears = new Map<number, Promise<void>>();
  const [map, setMap] = createStore<{ [key: number]: DateRecord | undefined }>(
    {}
  );

  async function load(date: Date) {
    const year = date.getFullYear();
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
          date: parse(fr.date, "yyyyMMdd", new Date()),
          isHoliday: fr.isHoliday,
          description: fr.description,
        }))
        .reduce(
          (acc, record) => {
            acc[record.date.valueOf()] = record;
            return acc;
          },
          {} as { [key: number]: DateRecord }
        );
      setMap(records);
      resolve();
    });
    loadingYears.set(year, loadPromise);
    await loadPromise;
  }

  function getDateRecord(date: Date) {
    load(date);
    return map[date.valueOf()];
  }

  return {
    getDateRecord,
  };
}

export const useHolidayStore = singulation(createHolidayStore);
