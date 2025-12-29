import { getLabelTextColor, useLabelStore } from "@frontend/stores/labelStore";
import { type Accessor, For } from "solid-js";

export default function LabelLine(props: { labelIds: Accessor<string[]> }) {
  const { labelIds } = props;
  const { getLabel } = useLabelStore();

  const mappedLabels = () =>
    labelIds()
      .map((labelId) => getLabel(labelId))
      .filter((l) => !!l)
      .sort((a, b) => {
        const pa = a.priority ?? Number.MAX_SAFE_INTEGER;
        const pb = b.priority ?? Number.MAX_SAFE_INTEGER;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      });

  return (
    <div class="flex flex-wrap justify-end">
      <For each={mappedLabels()}>{(label) => <LabelBlock {...label} />}</For>
    </div>
  );
}

export function LabelBlock(label: { color: string; name: string }) {
  return (
    <span
      class="text-xs px-1 py-0.5 rounded mr-1"
      style={{
        "background-color": label.color,
        color: getLabelTextColor(label.color),
      }}
    >
      {label.name}
    </span>
  );
}
