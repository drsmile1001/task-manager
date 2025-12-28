import { type JSX, createMemo, mergeProps, splitProps } from "solid-js";

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  icon?: JSX.Element;
}

const baseClass =
  "inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

const variantClass: Record<string, string> = {
  primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
};

const sizeClass: Record<string, string> = {
  small: "px-3 py-1 text-sm",
  medium: "px-4 py-2 text-base",
  large: "px-6 py-3 text-lg",
};

export function Button(props: ButtonProps) {
  const merged = mergeProps(
    { variant: "primary", size: "medium", loading: false },
    props
  );
  const [local, rest] = splitProps(merged, [
    "children",
    "variant",
    "size",
    "loading",
    "icon",
    "class",
    "disabled",
  ]);

  const classes = createMemo(() =>
    [
      baseClass,
      variantClass[local.variant!],
      sizeClass[local.size!],
      local.class || "",
    ].join(" ")
  );

  return (
    <button
      class={classes()}
      disabled={local.disabled || local.loading}
      {...rest}
    >
      {local.loading ? (
        <span class="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full inline-block" />
      ) : (
        local.icon && <span class="mr-2">{local.icon}</span>
      )}
      {local.children}
    </button>
  );
}

export default Button;
