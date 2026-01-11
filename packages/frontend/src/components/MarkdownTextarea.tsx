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
    element.querySelectorAll("ul li").forEach((el) => {
      el.className = "list-disc ml-6";
    });
    element.querySelectorAll("ol li").forEach((el) => {
      el.className = "list-decimal ml-6";
    });

    element.querySelectorAll("pre").forEach((el) => {
      el.className = "bg-gray-100 p-2 rounded overflow-x-auto";
    });

    element.querySelectorAll("code").forEach((el) => {
      el.className = "font-mono bg-gray-100 px-1 rounded";
    });

    element.querySelectorAll("blockquote").forEach((el) => {
      el.className = "border-l-4 border-gray-300 pl-4 italic text-gray-600";
    });

    element.querySelectorAll("hr").forEach((el) => {
      el.className = "my-4 border-t border-gray-300";
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
        class={`${baseInputClass} h-32 font-mono`}
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
        class={`${baseInputClass} min-h-32 font-mono w-full cursor-text`}
        classList={{
          hidden: editing(),
        }}
        innerHTML={parsed()}
        onDblClick={startEditing}
      ></div>
    </>
  );
}
