import { Point, Rectangle } from '../types/plugin';
import { captureViewport, restoreViewport } from './viewport';

export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

export function lineIntersectsRect(
  lineStart: Point, 
  lineEnd: Point, 
  rect: Rectangle
): boolean {
  const padding = 10;
  const expandedRect = {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + (padding * 2),
    height: rect.height + (padding * 2)
  };

  const rectLeft = expandedRect.x;
  const rectRight = expandedRect.x + expandedRect.width;
  const rectTop = expandedRect.y;
  const rectBottom = expandedRect.y + expandedRect.height;

  if ((lineStart.x < rectLeft && lineEnd.x < rectLeft) ||
    (lineStart.x > rectRight && lineEnd.x > rectRight) ||
    (lineStart.y < rectTop && lineEnd.y < rectTop) ||
    (lineStart.y > rectBottom && lineEnd.y > rectBottom)) {
    return false;
  }

  const lineLeft = Math.min(lineStart.x, lineEnd.x);
  const lineRight = Math.max(lineStart.x, lineEnd.x);
  const lineTop = Math.min(lineStart.y, lineEnd.y);
  const lineBottom = Math.max(lineStart.y, lineEnd.y);

  return !(lineRight < rectLeft || lineLeft > rectRight || lineBottom < rectTop || lineTop > rectBottom);
}

export function preserveViewport(operation: () => void | Promise<void>, delay: number = 50) {
  const currentViewport = captureViewport();

  const restore = () => {
    restoreViewport(currentViewport);
  };

  if (operation.constructor.name === 'AsyncFunction') {
    (operation as () => Promise<void>)().then(() => {
      setTimeout(restore, delay);
    });
  } else {
    (operation as () => void)();
    setTimeout(restore, delay);
  }
}
