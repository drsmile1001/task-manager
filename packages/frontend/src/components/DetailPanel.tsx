import { type JSX } from "solid-js";

import Button from "./Button";

export interface DetailPanelProps {
  title: JSX.Element | string;
  onClose: () => void;
  children: JSX.Element;
}

export default function DetailPanel(props: DetailPanelProps) {
  return (
    <div class="h-full flex-none w-[clamp(20rem,20vw,40rem)] border-l bg-white flex flex-col">
      <div class="p-3 border-b flex justify-between items-center bg-gray-50">
        <div class="font-semibold text-gray-700">{props.title}</div>
        <Button variant="secondary" size="small" onClick={props.onClose}>
          ✕
        </Button>
      </div>
      <div class="flex-1 overflow-auto">{props.children}</div>
    </div>
  );
}
