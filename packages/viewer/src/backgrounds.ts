import type { CSSProperties } from 'react'

/**
 * A light checkerboard painted behind the canvas iframe, revealed wherever the
 * configured backdrop is "transparent" (so a component's own edges are visible).
 */
export const CHECKERBOARD: CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage:
    'linear-gradient(45deg, #d4d7e0 25%, transparent 25%), linear-gradient(-45deg, #d4d7e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d4d7e0 75%), linear-gradient(-45deg, transparent 75%, #d4d7e0 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
}
