export function genWeek(start = new Date()) {
  const result = [];
  const base = new Date(start);
  // 將日期調整至週一
  const day = base.getDay() === 0 ? 7 : base.getDay();
  base.setDate(base.getDate() - (day - 1));

  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);

    result.push({
      key: d.toISOString().slice(0, 10),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
    });
  }

  return result;
}
