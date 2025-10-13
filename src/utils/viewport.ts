export interface ViewportState {
  center: { x: number; y: number };
  zoom: number;
}

export function captureViewport(): ViewportState {
  const center = figma.viewport.center;
  return {
    center: { x: center.x, y: center.y },
    zoom: figma.viewport.zoom
  };
}

export function restoreViewport(viewport: ViewportState) {
  // Assign new objects so Figma registers the viewport change
  figma.viewport.center = { x: viewport.center.x, y: viewport.center.y };
  figma.viewport.zoom = viewport.zoom;
}
