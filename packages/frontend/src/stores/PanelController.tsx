import { singulation } from "@frontend/utils/singulation";
import AuditLogListPanel from "@frontend/views/AuditLogListPanel";
import ImportTasksPanel from "@frontend/views/ImportTasksPanel";
import LabelPanel from "@frontend/views/LabelPanel";
import MilestoneDetailsPanel from "@frontend/views/MilestoneDetailsPanel";
import PersonDetailsPanel from "@frontend/views/PersonDetailsPanel";
import PersonListPanel from "@frontend/views/PersonPanel";
import ProjectArchivedMilestoneList from "@frontend/views/ProjectArchivedMilestoneList";
import ProjectArchivedTaskList from "@frontend/views/ProjectArchivedTaskList";
import ProjectDetailsPanel from "@frontend/views/ProjectDetailsPanel";
import ProjectListPanel from "@frontend/views/ProjectListPanel";
import SharedFilterPanel from "@frontend/views/SharedFilterPanel";
import TaskDetailsPanel from "@frontend/views/TaskDetailsPanel";
import TaskPool from "@frontend/views/TaskPool";
import { For } from "solid-js";
import { createStore } from "solid-js/store";

export type PanelOptions =
  | {
      type: "SHARED_FILTER";
    }
  | {
      type: "LABEL";
    }
  | {
      type: "PERSON_LIST";
    }
  | {
      type: "PERSON_DETAILS";
      personId: string;
    }
  | {
      type: "PROJECT_LIST";
    }
  | {
      type: "PROJECT_DETAILS";
      projectId: string;
    }
  | {
      type: "PROJECT_ARCHIVED_MILESTONE_LIST";
      projectId: string;
    }
  | {
      type: "PROJECT_ARCHIVED_TASK_LIST";
      projectId: string;
    }
  | {
      type: "IMPORT_TASKS";
    }
  | {
      type: "MILESTONE";
      milestoneId: string;
    }
  | {
      type: "TASK";
      taskId: string;
    }
  | {
      type: "TASK_POOL";
    }
  | {
      type: "AUDIT_LOG";
    };

function RenderPanel(options: PanelOptions) {
  if (!options) return <div></div>;
  switch (options.type) {
    case "SHARED_FILTER":
      return <SharedFilterPanel />;
    case "LABEL":
      return <LabelPanel />;
    case "PERSON_LIST":
      return <PersonListPanel />;
    case "PERSON_DETAILS":
      return <PersonDetailsPanel personId={options.personId} />;
    case "PROJECT_LIST":
      return <ProjectListPanel />;
    case "PROJECT_DETAILS":
      return <ProjectDetailsPanel projectId={options.projectId} />;
    case "PROJECT_ARCHIVED_MILESTONE_LIST":
      return <ProjectArchivedMilestoneList projectId={options.projectId} />;
    case "PROJECT_ARCHIVED_TASK_LIST":
      return <ProjectArchivedTaskList projectId={options.projectId} />;
    case "IMPORT_TASKS":
      return <ImportTasksPanel />;
    case "MILESTONE":
      return <MilestoneDetailsPanel milestoneId={options.milestoneId} />;
    case "TASK":
      return <TaskDetailsPanel taskId={options.taskId} />;
    case "TASK_POOL":
      return <TaskPool />;
    case "AUDIT_LOG":
      return <AuditLogListPanel />;
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
