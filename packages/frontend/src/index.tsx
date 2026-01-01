import { setDefaultOptions } from "date-fns";
import { zhTW } from "date-fns/locale";
import { render } from "solid-js/web";

import App from "./App";
import "./index.css";
import { usePanelController } from "./stores/PanelController";
import { useAssignmentStore } from "./stores/assignmentStore";
import { useFilterStore } from "./stores/filterStore";
import { useLabelStore } from "./stores/labelStore";
import { useMilestoneStore } from "./stores/milestoneStore";
import { usePersonStore } from "./stores/personStore";
import { useProjectStore } from "./stores/projectStore";
import { useTaskStore } from "./stores/taskStore";
import { sync } from "./sync";

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
