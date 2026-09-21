// apps/web/src/lib/templates/compositions.ts
// Composition layer: 8 independent layouts that combine with any of the 8
// templates for 64 possible looks. User override optional; auto-pick based
// on brand voice + holiday tone lands in Ship B3b.

export type CompositionId =
  | 'full-hero'
  | 'bottom-panel'
  | 'top-panel'
  | 'left-panel'
  | 'right-panel'
  | 'center-card'
  | 'center-circle'
  | 'vignette';

export interface CompositionDefinition {
  id: CompositionId;
  name: string;
  description: string;
  /** Full-bleed photo overlay opacity. Used by full-hero and vignette. */
  overlayOpacity?: number;
  /** Panel edge for panel compositions. */
  panelEdge?: 'top' | 'bottom' | 'left' | 'right';
  /** Panel height (top/bottom) or width (left/right) in px. */
  panelSize?: number;
  /** Center card size. */
  cardWidth?: number;
  cardHeight?: number;
  /** Center circle diameter. */
  circleSize?: number;
  /** Vignette gradient height at top and bottom. */
  vignetteEdge?: number;
}

export const COMPOSITIONS: CompositionDefinition[] = [
  {
    id: 'full-hero',
    name: 'Full Hero',
    description: 'Photo fills the canvas behind a soft colour wash. Content centred on top.',
    overlayOpacity: 0.65,
  },
  {
    id: 'bottom-panel',
    name: 'Bottom Panel',
    description: 'Photo occupies the top. Solid colour panel anchors the bottom with content.',
    panelEdge: 'bottom',
    panelSize: 300,
  },
  {
    id: 'top-panel',
    name: 'Top Panel',
    description: 'Solid colour band across the top holds logo and message. Photo fills the rest.',
    panelEdge: 'top',
    panelSize: 260,
  },
  {
    id: 'left-panel',
    name: 'Left Panel',
    description: 'Solid colour panel on the left. Photo on the right. Content in the panel.',
    panelEdge: 'left',
    panelSize: 500,
  },
  {
    id: 'right-panel',
    name: 'Right Panel',
    description: 'Photo on the left. Solid colour panel on the right hosts all content.',
    panelEdge: 'right',
    panelSize: 500,
  },
  {
    id: 'center-card',
    name: 'Center Card',
    description: 'Photo full bleed. Rounded colour card holds content in the centre.',
    cardWidth: 760,
    cardHeight: 470,
    overlayOpacity: 0.35,
  },
  {
    id: 'center-circle',
    name: 'Center Circle',
    description: 'Photo full bleed. Circular colour medallion behind the holiday message only.',
    circleSize: 460,
    overlayOpacity: 0.30,
  },
  {
    id: 'vignette',
    name: 'Vignette',
    description: 'Photo full bleed. Soft gradient edges frame the centre. Content in the clear zone.',
    vignetteEdge: 130,
  },
];

export function getComposition(id?: string | null): CompositionDefinition {
  if (!id) return COMPOSITIONS[0];
  return COMPOSITIONS.find((c) => c.id === id) || COMPOSITIONS[0];
}

export function isCompositionId(value: string): value is CompositionId {
  return COMPOSITIONS.some((c) => c.id === value);
}