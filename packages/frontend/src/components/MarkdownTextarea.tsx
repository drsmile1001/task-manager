import { marked } from "marked";
import { type JSX, createEffect, createSignal, splitProps } from "solid-js";

import { baseInputClass } from "./Input";

export interface MarkdownTextareaProps extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string | undefined;
  onConfirm: (val: string) => void;
}

export function MarkdownTextarea(props: MarkdownTextareaProps) {
  const [local, others] = splitProps(props, ["value", "onConfirm", "class"]);
  const [isEditing, setIsEditing] = createSignal(false);
  const [parsed, setParsed] = createSignal("");
  const [innerValue, setInnerValue] = createSignal("");
  let textareaRef: HTMLTextAreaElement | undefined;

  createEffect(() => {
    if (!isEditing()) {
      setInnerValue(local.value || "");
    }
  });

  createEffect(async () => {
    const parsed = await marked.parse(innerValue());
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

  function startEditing() {
    setIsEditing(true);
    setTimeout(() => {
      textareaRef?.focus();
    }, 0);
  }

  function stopEditing() {
    const trimmedValue = innerValue().trim();
    if (others.required && trimmedValue === "") {
      setInnerValue(local.value || "");
      setIsEditing(false);
      return;
    }
    if (trimmedValue !== local.value) {
      local.onConfirm(trimmedValue);
    }
    setIsEditing(false);
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") (e.currentTarget as HTMLTextAreaElement).blur();
  };

  return (
    <>
      <textarea
        {...others}
        ref={textareaRef}
        class={`${baseInputClass} h-32 font-mono`}
        classList={{
          hidden: !isEditing(),
        }}
        value={innerValue()}
        onInput={(e) => setInnerValue(e.currentTarget.value)}
        onBlur={stopEditing}
        onKeyDown={handleKeyDown}
      />
      <div
        class={`${baseInputClass} min-h-32 font-mono w-full cursor-text`}
        classList={{
          hidden: isEditing(),
        }}
        innerHTML={parsed()}
        onDblClick={startEditing}
      ></div>
    </>
  );
}
