import { client } from "@frontend/client";
import { format } from "date-fns";
import { createSignal } from "solid-js";
import { ulid } from "ulid";

import type { Assignment } from "@backend/schemas/Assignment";

export type AssignmentStore = ReturnType<typeof createAssignmentStore>;

export function createAssignmentStore() {
  const [assignments, setAssignments] = createSignal<Assignment[]>([]);

  async function loadAssignments() {
    const result = await client.api.assignments.get();
    if (result.error) {
      throw new Error("Failed to load assignments");
    }
    setAssignments(
      result.data.map((a) => ({ ...a, date: format(a.date, "yyyy-MM-dd") }))
    );
  }
  loadAssignments();

  async function createAssignment(input: Omit<Assignment, "id">) {
    const id = ulid();
    const a: Assignment = { id, ...input };
    const reulst = await client.api.assignments.post(a);
    if (reulst.error) {
      throw new Error(`Failed to create assignment`);
    }
    setAssignments((prev) => [...prev, a]);
    return a;
  }

  async function updateAssignment(id: string, patch: Partial<Assignment>) {
    const result = await client.api.assignments({ id }).patch(patch);
    if (result.error) {
      throw new Error(`Failed to update assignment`);
    }
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  }

  async function deleteAssignment(id: string) {
    const reuslt = await client.api.assignments({ id }).delete();
    if (reuslt.error) {
      throw new Error(`Failed to delete assignment`);
    }
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
