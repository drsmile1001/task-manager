import type { Task } from "../domain/task";

export interface TaskRepository {
  getAll(): Task[];
  saveAll(tasks: Task[]): void;
}

export class LocalStorageTaskRepository implements TaskRepository {
  key = "tasks";

  getAll(): Task[] {
    const json = localStorage.getItem(this.key);
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch (e) {
      console.error("Failed to parse tasks", e);
      return [];
    }
  }

  saveAll(tasks: Task[]): void {
    localStorage.setItem(this.key, JSON.stringify(tasks));
  }
}
