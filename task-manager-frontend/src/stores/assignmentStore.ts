import { createSignal, createEffect } from "solid-js";
import type { Assignment } from "../domain/assignment";
import {
  type AssignmentRepository,
  LocalStorageAssignmentRepository,
} from "../repositories/AssignmentRepository";

export type AssignmentStore = ReturnType<typeof createAssignmentStore>;

export function createAssignmentStore(
  repo: AssignmentRepository = new LocalStorageAssignmentRepository()
) {
  const [assignments, setAssignments] = createSignal<Assignment[]>(
    repo.getAll()
  );

  // persist every change
  createEffect(() => {
    repo.saveAll(assignments());
  });

  // CRUD ---------------------------------------

  function createAssignment(input: Omit<Assignment, "id">) {
    const id = crypto.randomUUID();
    const a: Assignment = { id, ...input };
    setAssignments((prev) => [...prev, a]);
    return a;
  }

  function updateAssignment(id: string, patch: Partial<Assignment>) {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  }

  function deleteAssignment(id: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  function getAssignment(id: string) {
    return assignments().find((a) => a.id === id);
  }

  // Query helpers for schedule table -----------

  function listByDate(date: string) {
    return assignments().filter((a) => a.date === date);
  }

  function listByPerson(personId: string) {
    return assignments().filter((a) => a.personId === personId);
  }

  function listByTask(taskId: string) {
    return assignments().filter((a) => a.taskId === taskId);
  }

  function listForPersonOnDate(personId: string, date: string) {
    return assignments().filter(
      (a) => a.personId === personId && a.date === date
    );
  }

  return {
    assignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignment,
    listByDate,
    listByPerson,
    listByTask,
    listForPersonOnDate,
  };
}
