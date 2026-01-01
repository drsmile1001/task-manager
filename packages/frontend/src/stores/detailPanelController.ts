import { singulation } from "@frontend/utils/singulation";
import { createStore } from "solid-js/store";

export type PanelOptions =
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
    }
  | {
      type: "TaskPool";
    };

export type PanelContext = PanelOptions & {
  deep: number;
};

function createPanelController() {
  const [stack, setState] = createStore<PanelContext[]>([]);

  function openPanel(context: PanelOptions) {
    setState([
      {
        ...context,
        deep: 0,
      },
    ]);
  }

  function closePanel() {
    setState([]);
  }

  function pushPanel(context: PanelOptions) {
    setState(stack.length, {
      ...context,
      deep: stack.length,
    });
  }

  function popPanel() {
    setState(stack.slice(0, -1));
  }

  return {
    stack,
    openPanel,
    closePanel,
    pushPanel,
    popPanel,
  };
}

export const usePanelController = singulation(createPanelController);
