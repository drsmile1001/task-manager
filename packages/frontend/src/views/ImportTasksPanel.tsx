import { client } from "@frontend/client";
import Button from "@frontend/components/Button";
import Panel, {
  PanelList,
  PanelSections,
  SectionLabel,
} from "@frontend/components/Panel";
import { baseTextareaClass } from "@frontend/components/Textarea";
import { useLabelStore } from "@frontend/stores/labelStore";
import { useMilestoneStore } from "@frontend/stores/milestoneStore";
import { usePersonStore } from "@frontend/stores/personStore";
import { useProjectStore } from "@frontend/stores/projectStore";
import { format, parse } from "date-fns";
import { createSignal } from "solid-js";
import { ulid } from "ulid";

type Ref = {
  id: string | null;
  name: string;
};

type ParsedTask = {
  project: Ref;
  milestone: Ref | null;
  task: string;
  description: string;
  dueDate: string | null;
  assignees: Ref[];
  labels: Ref[];
};

export default function ImportTasksPanel() {
  const [text, setText] = createSignal("");
  const [parsed, setParsed] = createSignal<ParsedTask[]>([]);
  const { projects } = useProjectStore();
  const { labels } = useLabelStore();
  const { milestones } = useMilestoneStore();
  const { persons } = usePersonStore();
  const headerHint = `\
專案名稱 必填\t里程碑名稱 可選\t工作名稱 必填\t描述 可選\t到期日 可選 yyyy-MM-dd\t負責人名稱 可選 逗號分隔\t標籤名稱 可選 逗號分隔`;

  const today = format(new Date(), "yyyy-MM-dd");

  const exampleWithOutHeader = `\
專案A\t里程碑A-1\t工作A-1-1\t工作A-1-1描述\t${today}\t人員1,人員2\t標籤1,標籤2
專案A\t\t工作A-1\t工作A-1描述\t\t人員1
專案B\t\t工作B-1`;

  const hint = `\
請貼上要匯入的工作，每行一個工作，欄位以 Tab 鍵分隔。
欄位順序為
- 專案名稱 必填
- 里程碑名稱 可選
- 工作名稱 必填
- 描述 可選
- 到期日 可選 yyyy-MM-dd
- 負責人名稱 可選 逗號分隔
- 標籤名稱 可選 逗號分隔

請複製範例到 Google 試算表或 Excel 編輯後，再貼回此處進行匯入。

請移除範例中的標題列再進行匯入。

匯入時，不存在的專案、里程碑、標籤、人員將會自動建立。請先檢查是否會導致重複建立。
`;

  function copyExampleToClipboard() {
    const example = `\
${headerHint}
${exampleWithOutHeader}`;
    navigator.clipboard.writeText(example);
  }

  function parseText(text: string) {
    const currentProjects = projects();
    const currentMilestones = milestones();
    const currentLabels = labels();
    const currentPersons = persons();

    const parsed: ParsedTask[] = [];
    for (const line of text.trim().split("\n")) {
      const [
        projectName,
        milestoneName,
        task,
        description,
        rawDueDate,
        rawAssignees,
        rawLabels,
      ] = line
        .split("\t")
        .map((s) => s.trim())
        .reduce((acc, curr, idx) => {
          acc[idx] = curr || "";
          return acc;
        }, new Array<string>(7).fill(""));
      if (!projectName || !task) {
        continue;
      }
      const project: Ref = {
        name: projectName,
        id: currentProjects.find((p) => p.name === projectName)?.id ?? null,
      };

      const milestone: Ref | null = (() => {
        if (!milestoneName) return null;
        return {
          name: milestoneName,
          id:
            currentMilestones.find(
              (m) => m.name === milestoneName && m.projectId === project.id
            )?.id ?? null,
        };
      })();

      const labels: Ref[] = (() => {
        if (!rawLabels) return [];
        return rawLabels.split(",").map((labelName) => {
          const name = labelName.trim();
          return {
            name,
            id: currentLabels.find((l) => l.name === name)?.id ?? null,
          };
        });
      })();

      const assignees: Ref[] = (() => {
        if (!rawAssignees) return [];
        return rawAssignees.split(",").map((personName) => {
          const name = personName.trim();
          return {
            name,
            id: currentPersons.find((p) => p.name === name)?.id ?? null,
          };
        });
      })();
      const dueDate = (() => {
        if (!rawDueDate) return null;
        const d = parse(rawDueDate, "yyyy-MM-dd", new Date());
        if (isNaN(d.getTime())) return null;
        return format(d, "yyyy-MM-dd");
      })();
      parsed.push({
        project,
        milestone,
        task,
        description,
        dueDate,
        assignees,
        labels,
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
    const createdMilestoneIds = new Map<string, string>();
    const createdPersonIds = new Map<string, string>();
    const createdLabelIds = new Map<string, string>();
    for (const task of toImport) {
      if (!task.project.id) {
        if (createdProjectIds.has(task.project.name)) {
          task.project.id = createdProjectIds.get(task.project.name)!;
        } else {
          const pId = ulid();
          await client.api.projects.post({
            id: pId,
            name: task.project.name,
            code: "",
            description: "",
            order: null,
            isArchived: false,
          });
          createdProjectIds.set(task.project.name, pId);
          task.project.id = pId;
          setImportingLog((log) => [
            ...log,
            `已建立專案 "${task.project.name}"`,
          ]);
        }
      }
      if (task.milestone && !task.milestone.id) {
        const key = `${task.project.id}:::${task.milestone.name}`;
        if (createdMilestoneIds.has(key)) {
          task.milestone.id = createdMilestoneIds.get(key)!;
        } else {
          const mId = ulid();
          await client.api.milestones.post({
            id: mId,
            projectId: task.project.id!,
            name: task.milestone.name,
            description: "",
            dueDate: task.dueDate,
            isArchived: false,
          });
          createdMilestoneIds.set(key, mId);
          task.milestone.id = mId;
          setImportingLog((log) => [
            ...log,
            `已建立里程碑 "${task.project.name}:${task.milestone!.name}"`,
          ]);
        }
      }
      const assigneeIds: string[] = [];
      for (const assignee of task.assignees) {
        if (assignee.id) {
          assigneeIds.push(assignee.id);
          continue;
        }
        if (createdPersonIds.has(assignee.name)) {
          assigneeIds.push(createdPersonIds.get(assignee.name)!);
          continue;
        }
        const personId = ulid();
        await client.api.persons.post({
          id: personId,
          name: assignee.name,
          email: "",
        });
        assigneeIds.push(personId);
        createdPersonIds.set(assignee.name, personId);
        setImportingLog((log) => [...log, `已建立人員 "${assignee.name}"`]);
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
        projectId: task.project.id,
        milestoneId: task.milestone?.id || null,
        name: task.task,
        description: task.description,
        dueDate: task.dueDate,
        assigneeIds,
        labelIds,
        isDone: false,
        isArchived: false,
      });
      setImportingLog((log) => [
        ...log,
        `已建立工作 "${task.project.name}:${task.task}"`,
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
        <SectionLabel>說明</SectionLabel>
        <pre class="w-full px-2 py-1 rounded bg-gray-100 text-wrap">{hint}</pre>
        <div>
          <Button variant="secondary" onclick={copyExampleToClipboard}>
            複製範例到剪貼簿
          </Button>
        </div>
        <SectionLabel>工作資料貼上區</SectionLabel>
        <textarea
          class={baseTextareaClass}
          disabled={importing()}
          value={text()}
          onInput={(e) => {
            const v = e.currentTarget.value;
            setText(v);
            parseText(v);
          }}
          placeholder={exampleWithOutHeader}
        />
        <SectionLabel>解析結果</SectionLabel>
        <div class="min-h-40 max-h-80 overflow-y-auto border p-2 bg-gray-100">
          <PanelList items={parsed}>
            {(item) => (
              <>
                <dl class="grid grid-cols-[auto_1fr] gap-x-4 mb-2">
                  <dt>專案</dt>
                  <dd>
                    <span>{item.project.name}</span>
                    <span class="text-blue-600">
                      {item.project.id ? "" : " <新增>"}
                    </span>
                  </dd>
                  <dt>里程碑</dt>
                  <dd>
                    <span>{item.milestone?.name ?? "<無>"}</span>
                    <span class="text-blue-600">
                      {item.milestone && !item.milestone.id ? " <新增>" : ""}
                    </span>
                  </dd>
                  <dt>工作</dt>
                  <dd>{item.task}</dd>
                  <dt>描述</dt>
                  <dd>{item.description || "<無>"}</dd>
                  <dt>到期日</dt>
                  <dd>{item.dueDate || "<無>"}</dd>
                  <dt>負責人</dt>
                  <dd>
                    {item.assignees.length === 0
                      ? "<無>"
                      : item.assignees
                          .map((assignee) => (
                            <>
                              <span>{assignee.name}</span>
                              <span class="text-blue-600">
                                {assignee.id ? "" : " <新增>"}
                              </span>
                            </>
                          ))
                          .reduce((prev, curr) => [prev, ", ", curr] as any)}
                  </dd>
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
