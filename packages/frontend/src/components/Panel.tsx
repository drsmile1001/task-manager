import Button from "@frontend/components/Button";
import { usePanelController } from "@frontend/stores/PanelController";
import { type JSX, Show } from "solid-js";

export interface DetailPanelProps {
  title: JSX.Element | string;
  children: JSX.Element;
  actions?: JSX.Element;
}

export default function Panel(props: DetailPanelProps) {
  const { closePanel, stack: panelStack, popPanel } = usePanelController();
  return (
    <div class="h-full shadow-lg flex-none w-120 border-l bg-white flex flex-col">
      <div class="p-1 border-b flex justify-between items-center bg-gray-50">
        <Button
          variant="secondary"
          size="small"
          disabled={panelStack.length <= 1}
          onClick={popPanel}
        >
          ←
        </Button>
        <div class="font-semibold text-gray-700">{props.title}</div>
        <Button variant="secondary" size="small" onClick={closePanel}>
          ✕
        </Button>
      </div>
      <Show when={props.actions}>
        <div class="py-1 px-2 border-b">{props.actions}</div>
      </Show>
      <div class="flex-1 p-2 overflow-y-auto">{props.children}</div>
    </div>
  );
}

export type PanelSectionsProps = {
  children: JSX.Element;
};

export function PanelSections(props: PanelSectionsProps) {
  return <div class="flex flex-col gap-1">{props.children}</div>;
}

export type PanelListProps<T> = {
  items: () => T[];
  children: (item: T) => JSX.Element;
};

export function PanelList<T>(props: PanelListProps<T>) {
  return (
    <PanelSections>
      {props.items().map((item) => (
        <div class="flex items-center gap-1 mb-1">{props.children(item)}</div>
      ))}
    </PanelSections>
  );
}

export function SectionLabel(props: { children: JSX.Element }) {
  return <label class="block text-sm font-medium mb-1">{props.children}</label>;
}
