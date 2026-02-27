import type { Assignment } from "@backend/schemas/Assignment";

export type AssignmentState = {
  byId: Record<string, Assignment | undefined>;
  byTaskId: Record<string, Assignment[]>;
  byPersonIdAndDate: Record<string, Assignment[]>;
};

export function byPersonIdAndDateKey(personId: string, date: string) {
  return `${personId}::${date}`;
}

export function buildAssignmentState(
  assignments: Assignment[]
): AssignmentState {
  const byId: Record<string, Assignment | undefined> = {};
  const byTaskId: Record<string, Assignment[]> = {};
  const byPersonIdAndDate: Record<string, Assignment[]> = {};

  for (const assignment of assignments) {
    byId[assignment.id] = assignment;

    if (!byTaskId[assignment.taskId]) {
      byTaskId[assignment.taskId] = [];
    }
    byTaskId[assignment.taskId].push(assignment);

    const personDateKey = byPersonIdAndDateKey(
      assignment.personId,
      assignment.date
    );
    if (!byPersonIdAndDate[personDateKey]) {
      byPersonIdAndDate[personDateKey] = [];
    }
    byPersonIdAndDate[personDateKey].push(assignment);
  }

  return {
    byId,
    byTaskId,
    byPersonIdAndDate,
  };
}

export function deleteAssignmentsByTaskIds(
  state: AssignmentState,
  taskIds: string[]
) {
  if (taskIds.length === 0) {
    return state;
  }
  const taskIdSet = new Set(taskIds);
  const remainedAssignments = Object.values(state.byId).filter(
    (assignment): assignment is Assignment =>
      !!assignment && !taskIdSet.has(assignment.taskId)
  );
  return buildAssignmentState(remainedAssignments);
}

export function deleteAssignmentsByPersonId(
  state: AssignmentState,
  personId: string
) {
  const remainedAssignments = Object.values(state.byId).filter(
    (assignment): assignment is Assignment =>
      !!assignment && assignment.personId !== personId
  );
  return buildAssignmentState(remainedAssignments);
}
