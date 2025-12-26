import { singulation } from "@frontend/utils/singulation";
import { createSignal } from "solid-js";

export type DragState =
  | { type: "none" }
  | { type: "task"; taskId: string }
  | {
      type: "assignment";
      assignmentId: string;
      fromPersonId: string;
      fromDate: string;
    };

function createDragStore() {
  const [state, setState] = createSignal<DragState>({ type: "none" });

  return {
    state,
    startTaskDrag(taskId: string) {
      setState({ type: "task", taskId });
    },
    startAssignmentDrag(a: {
      assignmentId: string;
      personId: string;
      date: string;
    }) {
      setState({
        type: "assignment",
        assignmentId: a.assignmentId,
        fromPersonId: a.personId,
        fromDate: a.date,
      });
    },

    clear() {
      setState({ type: "none" });
    },
  };
}

export const useDragStore = singulation(createDragStore);
