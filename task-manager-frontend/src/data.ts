export const persons = [
  { id: "U1", name: "Anna" },
  { id: "U2", name: "Kevin" },
  { id: "U3", name: "Lisa" },
];

export const assignments = [
  { personId: "U1", date: "2025-11-25", taskId: "T1" },
  { personId: "U1", date: "2025-11-25", taskId: "T4" },
  { personId: "U2", date: "2025-11-26", taskId: "T2" },
  { personId: "U2", date: "2025-11-27", taskId: "T3" },
];

export type Person = {
  id: string;
  name: string;
};

export type Task = {
  id: string;
  name: string;
};

export type Assignment = {
  personId: string;
  date: string;
  taskId: string;
};
