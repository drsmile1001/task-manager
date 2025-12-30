import { setDefaultOptions } from "date-fns";
import { zhTW } from "date-fns/locale";
import { render } from "solid-js/web";

import App from "./App.tsx";
import "./index.css";
import { useAssignmentStore } from "./stores/assignmentStore.ts";
import { usePanelController } from "./stores/detailPanelController.ts";
import { useFilterStore } from "./stores/filterStore.ts";
import { useLabelStore } from "./stores/labelStore.ts";
import { useMilestoneStore } from "./stores/milestoneStore.ts";
import { usePersonStore } from "./stores/personStore.ts";
import { useProjectStore } from "./stores/projectStore.ts";
import { useTaskStore } from "./stores/taskStore.ts";
import { sync } from "./sync.ts";

setDefaultOptions({ locale: zhTW });

const root = document.getElementById("root");

render(() => {
  usePanelController();
  useFilterStore();
  useLabelStore();
  usePersonStore();
  useProjectStore();
  useMilestoneStore();
  useTaskStore();
  useAssignmentStore();
  sync();
  return <App />;
}, root!);
