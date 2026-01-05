import { singulation } from "@frontend/utils/singulation";
import ImportTasksPanel from "@frontend/views/ImportTasksPanel";
import LabelPanel from "@frontend/views/LabelPanel";
import MilestoneDetailsPanel from "@frontend/views/MilestoneDetailsPanel";
import PersonDetailsPanel from "@frontend/views/PersonDetailsPanel";
import PersonListPanel from "@frontend/views/PersonPanel";
import ProjectDetailsPanel from "@frontend/views/ProjectDetailsPanel";
import ProjectListPanel from "@frontend/views/ProjectListPanel";
import SharedFilterPanel from "@frontend/views/SharedFilterPanel";
import TaskDetailsPanel from "@frontend/views/TaskDetailsPanel";
import TaskPool from "@frontend/views/TaskPool";
import { For } from "solid-js";
import { createStore } from "solid-js/store";

export type PanelOptions =
  | {
      type: "SharedFilter";
    }
  | {
      type: "Label";
    }
  | {
      type: "PersonList";
    }
  | {
      type: "PersonDetails";
      personId: string;
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

function RenderPanel(options: PanelOptions) {
  if (!options) return <div></div>;
  switch (options.type) {
    case "SharedFilter":
      return <SharedFilterPanel />;
    case "Label":
      return <LabelPanel />;
    case "PersonList":
      return <PersonListPanel />;
    case "PersonDetails":
      return <PersonDetailsPanel personId={options.personId} />;
    case "ProjectList":
      return <ProjectListPanel />;
    case "ProjectDetails":
      return <ProjectDetailsPanel projectId={options.projectId} />;
    case "ImportTasks":
      return <ImportTasksPanel />;
    case "Milestone":
      return <MilestoneDetailsPanel milestoneId={options.milestoneId} />;
    case "Task":
      return <TaskDetailsPanel taskId={options.taskId} />;
    case "TaskPool":
      return <TaskPool />;
    default:
      return <div></div>;
  }
}

export function Panels() {
  const { stack } = usePanelController();

  return (
    <For each={stack}>
      {(context) => (
        <div
          class="absolute top-0 h-full w-full md:w-120"
          style={{
            "z-index": context.deep + 100,
          }}
        >
          {RenderPanel(context)}
        </div>
      )}
    </For>
  );
}

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
