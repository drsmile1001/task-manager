import { marked } from "marked";
import { type JSX, createEffect, createSignal } from "solid-js";

import { baseInputClass } from "./Input";

export interface MarkdownTextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  updateValue(value: string): void;
}

export function MarkdownTextarea(props: MarkdownTextareaProps) {
  const [value, setValue] = createSignal<string>(String(props.value || ""));
  const [editing, setEditing] = createSignal(false);
  const [parsed, setParsed] = createSignal("");
  let textareaRef: HTMLTextAreaElement | undefined;

  createEffect(() => {
    setValue(String(props.value || ""));
  });

  createEffect(async () => {
    const parsed = await marked.parse((props.value as string) || "");
    const element = document.createElement("div");
    element.innerHTML = parsed;
    element.querySelectorAll("script").forEach((el) => el.remove());
    element.querySelectorAll("a").forEach((el) => {
      el.className = "text-blue-600 underline cursor-pointer";
      el.setAttribute("target", "_blank");
    });
    element.querySelectorAll("li").forEach((el) => {
      el.className = "list-disc ml-6";
    });
    setParsed(element.innerHTML);
  });

  let changed = false;

  function startEditing() {
    changed = false;
    setEditing(true);
    setTimeout(() => {
      textareaRef?.focus();
    }, 0);
  }

  function stopEditing() {
    setEditing(false);
    if (!changed) return;
    props.updateValue(value());
  }

  return (
    <>
      <textarea
        ref={textareaRef}
        class={`${baseInputClass} h-32`}
        classList={{
          hidden: !editing(),
        }}
        value={value()}
        onInput={(e) => {
          setValue(e.currentTarget.value ?? "");
          changed = true;
        }}
        onBlur={stopEditing}
      />
      <div
        class={`${baseInputClass} min-h-32 w-full cursor-text`}
        classList={{
          hidden: editing(),
        }}
        innerHTML={parsed()}
        onDblClick={startEditing}
      ></div>
    </>
  );
}
