export type Assignment = {
  id: string;
  taskId: string;
  personId: string;
  date: string; // ISO string of yyyy-MM-dd
  note?: string;
};
