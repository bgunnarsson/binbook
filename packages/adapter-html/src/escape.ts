const HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML[c]);
}

export function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML[c]);
}
