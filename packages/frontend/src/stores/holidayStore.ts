import { singulation } from "@frontend/utils/singulation";
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

  return {
    getDateRecord,
  };
}

export const useHolidayStore = singulation(createHolidayStore);
