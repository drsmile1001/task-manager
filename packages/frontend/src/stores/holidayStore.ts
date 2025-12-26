import { singulation } from "@frontend/utils/singulation";
import { parse } from "date-fns";
import ky from "ky";
import { createMemo, createSignal } from "solid-js";

export type DateRecord = {
  date: Date;
  isHoliday: boolean;
  description: string;
};

function createHolidayStore() {
  const loadingYears = new Map<number, Promise<void>>();
  const [dateRecords, setDateRecords] = createSignal<DateRecord[]>([]);
  const dateRecordMap = createMemo(() => {
    return new Map(dateRecords().map((dr) => [dr.date.valueOf(), dr]));
  });

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
      const records = fetchedRecord.map((fr) => ({
        date: parse(fr.date, "yyyyMMdd", new Date()),
        isHoliday: fr.isHoliday,
        description: fr.description,
      }));
      setDateRecords((prev) => [...prev, ...records]);
      resolve();
    });
    loadingYears.set(year, loadPromise);
    await loadPromise;
  }

  function getDateRecord(date: Date) {
    load(date);
    return dateRecordMap().get(date.valueOf());
  }

  return {
    getDateRecord,
  };
}

export const useHolidayStore = singulation(createHolidayStore);
