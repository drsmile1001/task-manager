import type { JSX } from "solid-js";

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {}

export default function Input(props: InputProps) {
  const { class: localClass, ...rest } = props;
  const baseClass = "border px-2 py-1 rounded";
  const megedClass = `${baseClass} ${localClass}`;
  return <input class={megedClass} {...rest} />;
}
