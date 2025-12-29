import { client } from "@frontend/client";
import { useLabelStore } from "@frontend/stores/labelStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { createSignal } from "solid-js";
import { ulid } from "ulid";

import Button from "./Button";
import DetailPanel from "./DetailPanel";

export type PersonPanelProps = {
  onClose: () => void;
};

type ParsedTask = {
  projectName: string;
  projectId: string | null;
  taskName: string;
  labels: {
    name: string;
    id: string | null;
  }[];
  description: string;
};

export default function ImportTasksPanel(props: PersonPanelProps) {
  const [text, setText] = createSignal("");
  const [parsed, setParsed] = createSignal<ParsedTask[]>([]);
  const { projects } = useProjectStore();
  const { labels } = useLabelStore();

  const hint = `\
請輸入要匯入的工作，每行一個工作，欄位以 Tab 鍵分隔。
欄位順序為
- 專案名稱 必填
- 工作名稱 必填
- 標籤名稱（多個標籤以逗號分隔）
- 描述。

可以從 Google 試算表或 Excel 複製貼上。

範例：
專案A	工作1	標籤X, 標籤Y 描述
專案B	工作2	標籤Z
專案A	工作3	
`;

  function parseText(text: string) {
    const currentProjects = projects();
    const currentLabels = labels();
    const parsed: ParsedTask[] = [];
    for (const line of text.trim().split("\n")) {
      const [projectName, taskName, rawLabels, description] = line
        .split("\t")
        .map((s) => s.trim());
      if (!projectName || !taskName) {
        continue;
      }
      const matchedProject = currentProjects.find(
        (p) => p.name === projectName
      );
      const projectId = matchedProject ? matchedProject.id : null;
      const labelNames = rawLabels
        ? rawLabels
            .split(",")
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
        : [];
      const labels = labelNames.map((name) => {
        const matchedLabel = currentLabels.find((l) => l.name === name);
        return {
          name,
          id: matchedLabel ? matchedLabel.id : null,
        };
      });
      parsed.push({
        projectName,
        taskName,
        projectId,
        labels,
        description: description || "",
      });
    }
    setParsed(parsed);
  }

  const [importing, setImporting] = createSignal(false);
  const [importingLog, setImportingLog] = createSignal<string[]>([]);

  async function importTasks() {
    setImporting(true);
    setImportingLog(["開始匯入..."]);
    const toImport = parsed();
    const createdProjectIds = new Map<string, string>();
    const createdLabelIds = new Map<string, string>();
    for (const task of toImport) {
      if (!task.projectId) {
        if (createdProjectIds.has(task.projectName)) {
          task.projectId = createdProjectIds.get(task.projectName)!;
          continue;
        }
        const pId = ulid();
        await client.api.projects.post({
          id: pId,
          name: task.projectName,
          description: "",
          order: null,
          isArchived: false,
          startedAt: null,
          endedAt: null,
        });
        createdProjectIds.set(task.projectName, pId);
        task.projectId = pId;
        setImportingLog((log) => [...log, `已建立專案 "${task.projectName}"`]);
      }
      const labelIds: string[] = [];
      for (const label of task.labels) {
        if (label.id) {
          labelIds.push(label.id);
          continue;
        }
        if (createdLabelIds.has(label.name)) {
          labelIds.push(createdLabelIds.get(label.name)!);
          continue;
        }
        const lId = ulid();
        await client.api.labels.post({
          id: lId,
          name: label.name,
          color: "#cccccc",
          priority: null,
        });
        labelIds.push(lId);
        createdLabelIds.set(label.name, lId);
        setImportingLog((log) => [...log, `已建立標籤 "${label.name}"`]);
      }
      await client.api.tasks.post({
        id: ulid(),
        name: task.taskName,
        description: task.description,
        projectId: task.projectId!,
        labelIds,
        isDone: false,
        isArchived: false,
        dueDate: null,
        assigneeIds: [],
      });
      setImportingLog((log) => [
        ...log,
        `已建立工作 "${task.projectName}:${task.taskName}"`,
      ]);
    }
    setImportingLog((log) => [...log, "匯入完成"]);
    setImporting(false);
    setParsed([]);
    setText("");
  }

  function clear() {
    setParsed([]);
    setText("");
    setImportingLog([]);
  }
  return (
    <DetailPanel title="匯入工作" onClose={props.onClose}>
      <div class="p-2 flex flex-col gap-4">
        <textarea
          disabled={importing()}
          class="w-full h-80 border rounded p-2"
          value={text()}
          onInput={(e) => {
            const v = e.currentTarget.value;
            setText(v);
            parseText(v);
          }}
          placeholder={hint}
        />

        <label class="font-bold">解析結果</label>
        <div class="flex flex-col">
          {parsed().map((item) => (
            <div class="flex flex-col gap-1 border-b pb-2">
              <div>
                專案: {item.projectName} {item.projectId ? "" : "<新增>"}
              </div>
              <div>工作: {item.taskName}</div>
              <div>
                標籤:{" "}
                {item.labels.length === 0
                  ? "無"
                  : item.labels
                      .map(
                        (label) => `${label.name} ${label.id ? "" : "<新增>"}`
                      )
                      .join(", ")}
              </div>
              <div>描述: {item.description || "<無>"}</div>
            </div>
          ))}
        </div>
        <label class="font-bold">匯入日誌</label>
        <div class="h-40 overflow-y-auto border p-2 bg-gray-100">
          {importingLog().map((log) => (
            <div>{log}</div>
          ))}
        </div>

        <div class="flex gap-2">
          <Button variant="secondary" disabled={importing()} onclick={clear}>
            清除
          </Button>
          <Button
            variant="secondary"
            disabled={importing()}
            onclick={importTasks}
          >
            匯入
          </Button>
        </div>
      </div>
    </DetailPanel>
  );
}
