import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

// A decorator: wraps a story in an in-memory Router so components that use
// react-router (<Link>, useNavigate, …) render in isolation. Referenced from a
// story's `decorators` (or globally in binbook.config.ts).
export default function withRouter({ children }: { children?: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}
