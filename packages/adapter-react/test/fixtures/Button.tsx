interface ButtonProps {
  variant?: string;
  label?: string;
  disabled?: boolean;
}

export default function Button({ variant = "primary", label = "", disabled = false }: ButtonProps) {
  return (
    <button className={`btn btn--${variant}`} disabled={disabled}>
      {label}
    </button>
  );
}
