import type { Assignment } from "../domain/assignment";

export interface AssignmentRepository {
  getAll(): Assignment[];
  saveAll(assignments: Assignment[]): void;
}

export class LocalStorageAssignmentRepository implements AssignmentRepository {
  key = "assignments";
  constructor() {}

  getAll(): Assignment[] {
    const json = localStorage.getItem(this.key);
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch (e) {
      console.error("Failed to parse assignments", e);
      return [];
    }
  }

  saveAll(assignments: Assignment[]): void {
    localStorage.setItem(this.key, JSON.stringify(assignments));
  }
}
