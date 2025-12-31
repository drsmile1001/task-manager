import type { JSX } from "solid-js/jsx-runtime";

export type TextareaProps = JSX.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea(props: TextareaProps) {
  const { class: localClass, ...rest } = props;
  const baseClass = "border h-16 w-full px-2 py-1 rounded";
  const mergedClass = `${baseClass} ${localClass}`;
  return <textarea class={mergedClass} {...rest} />;
}
