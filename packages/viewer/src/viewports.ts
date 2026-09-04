export interface Viewport {
  key: string
  /** Short label shown in the segmented control ("↔", "390", …). */
  label: string
  /** Tooltip / accessible name. */
  title: string
  /** null = responsive / fluid width. */
  width: number | null
}

export const VIEWPORTS: Viewport[] = [
  { key: 'responsive', label: '↔', title: 'Responsive', width: null },
  { key: 'mobile', label: '390', title: 'Mobile · 390px', width: 390 },
  { key: 'tablet', label: '768', title: 'Tablet · 768px', width: 768 },
  { key: 'desktop', label: '1280', title: 'Desktop · 1280px', width: 1280 },
]

export function viewportByKey(key: string): Viewport {
  return VIEWPORTS.find((v) => v.key === key) ?? VIEWPORTS[0]
}
