import { useHolidayStore } from "@frontend/stores/holidayStore";
import { addDays, format, startOfDay, startOfWeek } from "date-fns";
import { For, createMemo, createSignal } from "solid-js";

type WeekEntry = {
  name: string;
  startDate: Date;
  endDate: Date;
  days: {
    date: Date;
    isHoliday: boolean;
    isToday: boolean;
  }[];
};

const viewWeeks = 8;

export default function WeekScheduleTable() {
  const today = startOfDay(new Date());
  const { getDateRecord } = useHolidayStore();
  const [currentWeekStart, setCurrentWeekStart] = createSignal(
    startOfWeek(today, { weekStartsOn: 1 })
  );

  const weeks = createMemo(() => {
    const weeks: WeekEntry[] = [];
    let curr = currentWeekStart();
    for (let w = 0; w < viewWeeks; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(curr, d);
        const dateRecord = getDateRecord(date);
        const isToday = date.valueOf() === today.valueOf();
        const isHoliday = dateRecord?.isHoliday ?? false;
        weekDays.push({ date, isHoliday, isToday });
      }
      weeks.push({
        name: `${format(curr, "YY", {
          useAdditionalWeekYearTokens: true,
        })} W${format(curr, "II")}`,
        startDate: curr,
        endDate: addDays(curr, 6),
        days: weekDays,
      });
      curr = addDays(curr, 7);
    }
    return weeks;
  });

  return (
    <div class="h-full flex-1 p-4 overflow-hidden flex flex-col gap-4">
      <div class="flex-none flex flex-col gap-2">
        <div class="text-gray-700 font-bold">工作表</div>
        <div class="flex gap-2 items-center">TODO: 導覽列</div>
      </div>
      <div class="flex-1 w-full overflow-auto">
        <div
          class="grid"
          style={{
            "grid-template-columns": `repeat(${weeks().length + 1}, clamp(6rem, 8vw, 8rem))`,
          }}
        >
          <div class="border-b border-r p-2 sticky left-0 top-0 z-[3] bg-gray-100 font-semibold text-sm">
            專案 \ 週次
          </div>
          <For each={weeks()}>
            {(w) => (
              <div class="border-b border-r border-gray-300 sticky top-0 z-[1] bg-gray-100 text-sm text-center flex flex-col select-none">
                {/* 上半部：日期等分區塊 */}
                <div class="grid grid-cols-7 h-12 border-b border-gray-200">
                  <For each={w.days}>
                    {(d) => (
                      <div
                        class="flex items-center justify-center text-xs border-r last:border-r-0 border-gray-100"
                        style={{
                          "background-color": d.isHoliday
                            ? "#fee2e2"
                            : "transparent", // 假日淡紅色
                          color: d.isHoliday
                            ? "#ef4444"
                            : d.isToday
                              ? "#3b82f6"
                              : "#6b7280",
                          "font-weight": d.isToday ? "bold" : "normal",
                        }}
                      >
                        <span class="[writing-mode:vertical-lr] tracking-tighter">
                          {format(d.date, "MM/dd")}
                        </span>
                      </div>
                    )}
                  </For>
                </div>

                {/* 下半部：週次名稱 */}
                <div class="py-1 font-bold text-gray-600 bg-gray-50/50">
                  {w.name}
                </div>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
