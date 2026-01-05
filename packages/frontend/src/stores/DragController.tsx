import { singulation } from "@frontend/utils/singulation";
import { type JSX, createSignal } from "solid-js";

export type DragContext =
  | { type: "TASK"; taskId: string }
  | { type: "MILESTONE"; milestoneId: string }
  | {
      type: "ASSIGNMENT";
      assignmentId: string;
      fromPersonId: string;
      fromDate: string;
    }
  | {
      type: "PLANNING";
      planningId: string;
      fromWeekStartDate: string;
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
  const [dragContext, setDragContext] = createSignal<DragContext | null>(null);
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
    dragContext,
    setDragContext,
    setDragImage,
    notifyRenderReady,
    renderFn,
  };
}

export const useDragController = singulation(createDragController);
