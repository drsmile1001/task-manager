import { singulation } from "@frontend/utils/singulation";
import { type JSX, createSignal } from "solid-js";

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
  const [renderFn, setRenderFn] = createSignal<{
    render: () => JSX.Element;
  }>();

  let resolveRender: (el: HTMLElement) => void;
  async function setDragImage(
    e: DragEvent,
    fn: () => JSX.Element
  ): Promise<void> {
    const el = await new Promise<HTMLElement>((resolve) => {
      resolveRender = resolve;
      setRenderFn({
        render: fn,
      });
    });
    if (e.dataTransfer) {
      e.dataTransfer.setDragImage(el, 20, 20);
    }
  }
  function notifyRenderReady(el: HTMLElement) {
    if (resolveRender) {
      resolveRender(el);
    }
  }

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

    setDragImage,
    notifyRenderReady,
    renderFn,
  };
}

export const useDragStore = singulation(createDragStore);
