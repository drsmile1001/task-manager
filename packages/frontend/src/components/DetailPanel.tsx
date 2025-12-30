import { usePanelController } from "@frontend/stores/detailPanelController";
import { type JSX } from "solid-js";

import Button from "./Button";

export interface DetailPanelProps {
  title: JSX.Element | string;
  children: JSX.Element;
}

export default function DetailPanel(props: DetailPanelProps) {
  const { closePanel, contextStack, popPanel } = usePanelController();
  return (
    <div class="h-full flex-none w-[clamp(20rem,20vw,40rem)] border-l bg-white flex flex-col">
      <div class="p-3 border-b flex justify-between items-center bg-gray-50">
        <Button
          variant="secondary"
          size="small"
          disabled={contextStack().length === 1}
          onClick={popPanel}
        >
          ←
        </Button>
        <div class="font-semibold text-gray-700">{props.title}</div>
        <Button variant="secondary" size="small" onClick={closePanel}>
          ✕
        </Button>
      </div>
      <div class="flex-1 overflow-auto">{props.children}</div>
    </div>
  );
}
