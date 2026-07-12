export interface Viewport {
  name: string;
  width: number | null;
  height: number | null;
}

export const VIEWPORTS: Viewport[] = [
  { name: "Mobile", width: 375, height: 667 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Desktop", width: 1280, height: 800 },
  { name: "Full", width: null, height: null },
];
