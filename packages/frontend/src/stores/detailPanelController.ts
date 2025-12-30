import { singulation } from "@frontend/utils/singulation";
import { createSignal } from "solid-js";

export type PanelContext =
  | {
      type: "Filter";
    }
  | {
      type: "Label";
    }
  | {
      type: "Person";
    }
  | {
      type: "ProjectList";
    }
  | {
      type: "ProjectDetails";
      projectId: string;
    }
  | {
      type: "ImportTasks";
    }
  | {
      type: "Milestone";
      milestoneId: string;
    }
  | {
      type: "Task";
      taskId: string;
    };

function createPanelController() {
  const [contextStack, setContextStack] = createSignal<PanelContext[]>([]);

  function currentContext() {
    const stack = contextStack();
    return stack[stack.length - 1] || null;
  }

  function openPanel(context: PanelContext) {
    setContextStack([context]);
  }

  function closePanel() {
    setContextStack([]);
  }

  function pushPanel(context: PanelContext) {
    setContextStack([...contextStack(), context]);
  }

  function popPanel() {
    const stack = contextStack();
    stack.pop();
    setContextStack([...stack]);
  }

  return {
    contextStack,
    currentContext,
    openPanel,
    closePanel,
    pushPanel,
    popPanel,
  };
}

export const usePanelController = singulation(createPanelController);
