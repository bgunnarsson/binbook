export interface ButtonProps {
  label?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

// Styling comes from the project's own stylesheet (see binbook.config.ts
// `styles`), injected into the canvas — no per-component CSS here.
export default function Button({ label = "Click me", variant = "primary", size = "md", disabled = false }: ButtonProps) {
  return (
    <button className={`btn btn--${variant} btn--${size}`} disabled={disabled}>
      {label}
    </button>
  );
}
