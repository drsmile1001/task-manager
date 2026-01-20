import {
  type Component,
  type JSX,
  createEffect,
  createSignal,
  splitProps,
} from "solid-js";

interface EditableInputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  value: string | undefined;
  onConfirm: (val: string) => void;
}

export const baseInputClass = "border px-2 py-1 rounded";

export const Input: Component<EditableInputProps> = (props) => {
  const [local, others] = splitProps(props, ["value", "onConfirm", "class"]);
  const [isEditing, setIsEditing] = createSignal(false);
  const [innerValue, setInnerValue] = createSignal("");

  createEffect(() => {
    if (!isEditing()) {
      setInnerValue(local.value || "");
    }
  });

  const stopEditing = () => {
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
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape")
      (e.currentTarget as HTMLInputElement).blur();
  };

  function handleFocus() {
    setInnerValue(local.value || "");
    setIsEditing(true);
  }

  return (
    <input
      {...others}
      class={`${baseInputClass} ${local.class || ""}`}
      value={innerValue()}
      onFocus={handleFocus}
      onInput={(e) => setInnerValue(e.currentTarget.value)}
      onBlur={stopEditing}
      onKeyDown={handleKeyDown}
    />
  );
};
