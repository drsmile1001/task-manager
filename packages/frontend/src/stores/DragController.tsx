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

export function DragImageRenderer() {
  let containerRef: HTMLDivElement | undefined;
  const { renderFn, notifyRenderReady } = useDragController();

  function render() {
    const state = renderFn();
    if (!state) return null;
    queueMicrotask(() => {
      if (containerRef?.firstElementChild) {
        notifyRenderReady(containerRef.firstElementChild as HTMLElement);
      }
    });
    return state.render();
  }

  return (
    <div
      class="absolute top-[-100vh] left-[-100vw] pointer-events-none"
      ref={containerRef}
    >
      {render()}
    </div>
  );
}

function createDragController() {
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

export const useDragController = singulation(createDragController);
