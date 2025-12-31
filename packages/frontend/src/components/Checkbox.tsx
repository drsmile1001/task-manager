import type { JSX } from "solid-js";

export interface CheckboxProps extends Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  "type"
> {}

export default function Checkbox(props: CheckboxProps) {
  const { class: localClass, title, ...rest } = props;
  const baseClass =
    "inline-flex items-center gap-1 text-sm cursor-pointer select-none";
  const mergedClass = `${baseClass} ${localClass}`;

  function renderTitle() {
    if (props.children) return <>{props.children}</>;
    if (props.title) return <span>{props.title}</span>;
    return null;
  }

  return (
    <label class={mergedClass}>
      <input type="checkbox" {...rest} />
      {renderTitle()}
    </label>
  );
}
