import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Panel, {
  PanelList,
  PanelSections,
  SectionLabel,
} from "@frontend/components/Panel";
import { Textarea } from "@frontend/components/Textarea";
import { useLabelStore } from "@frontend/stores/labelStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { createSignal } from "solid-js";
import { ulid } from "ulid";

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

export default function ImportTasksPanel() {
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
        milestoneId: null,
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
    <Panel title="匯入工作">
      <PanelSections>
        <SectionLabel>工作資料貼上區</SectionLabel>
        <Textarea
          class="h-80"
          disabled={importing()}
          value={text()}
          onInput={(e) => {
            const v = e.currentTarget.value;
            setText(v);
            parseText(v);
          }}
          placeholder={hint}
        />
        <SectionLabel>解析結果</SectionLabel>
        <div class="min-h-40 max-h-80 overflow-y-auto border p-2 bg-gray-100">
          <PanelList items={parsed}>
            {(item) => (
              <>
                <dl class="grid grid-cols-[auto_1fr] gap-x-4 mb-2">
                  <dt>專案</dt>
                  <dd>
                    <span>{item.projectName}</span>
                    <span class="text-blue-600">
                      {item.projectId ? "" : " <新增>"}
                    </span>
                  </dd>
                  <dt>工作</dt>
                  <dd>{item.taskName}</dd>
                  <dt>標籤</dt>
                  <dd>
                    {item.labels.length === 0
                      ? "<無>"
                      : item.labels
                          .map((label) => (
                            <>
                              <span>{label.name}</span>
                              <span class="text-blue-600">
                                {label.id ? "" : " <新增>"}
                              </span>
                            </>
                          ))
                          .reduce((prev, curr) => [prev, ", ", curr] as any)}
                  </dd>
                  <dt>描述</dt>
                  <dd>{item.description || "<無>"}</dd>
                </dl>
              </>
            )}
          </PanelList>
        </div>

        <SectionLabel>匯入日誌</SectionLabel>
        <div class="h-40 overflow-y-auto border p-2 bg-gray-100">
          {importingLog().map((log) => (
            <div>{log}</div>
          ))}
        </div>

        <SectionLabel>操作</SectionLabel>
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
      </PanelSections>
    </Panel>
  );
}
