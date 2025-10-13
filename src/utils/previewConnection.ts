import { ConnectionConfig } from '../types';

type Point = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };

interface ConnectionPoints {
  startPoint: Point;
  endPoint: Point;
  startOffsetPoint: Point;
  endOffsetPoint: Point;
  waypoints: Point[];
}

export interface PreviewGeometry {
  canvas: { width: number; height: number };
  frames: [Rect, Rect];
  path: string;
  strokeDasharray?: string;
  color: string;
  opacity: number;
  strokeWidth: number;
  arrowheads: Array<{ type: 'start' | 'end'; path: string }>;
  label: null | {
    rect: Rect;
    text: string;
    fontSize: number;
    textColor: string;
    background: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    padding: number;
  };
}

const PREVIEW_CANVAS = { width: 240, height: 168 };
const SOURCE_FRAME: Rect = { x: 40, y: 48, width: 56, height: 40 };
const TARGET_FRAME: Rect = { x: 152, y: 120, width: 56, height: 40 };

const ARROW_LENGTH = 12;
const ARROW_ANGLE = Math.PI / 6;

export function buildPreviewGeometry(config: ConnectionConfig): PreviewGeometry {
  const frames: [Rect, Rect] = [SOURCE_FRAME, TARGET_FRAME];

  const connectionPoints = calculateConnectionPoints(frames[0], frames[1], config);
  let path = createPathData(connectionPoints, config);
  path = addSloppiness(path, config);

  const { startAngle, endAngle } = calculateArrowAngles(connectionPoints, config);
  const arrowheads: Array<{ type: 'start' | 'end'; path: string }> = [];

  if (config.arrowheads === 'end' || config.arrowheads === 'both') {
    arrowheads.push({
      type: 'end',
      path: toArrowPolygon(connectionPoints.endPoint, endAngle)
    });
  }

  if (config.arrowheads === 'both') {
    arrowheads.push({
      type: 'start',
      path: toArrowPolygon(connectionPoints.startPoint, startAngle + Math.PI)
    });
  }

  const label = buildLabelGeometry(connectionPoints, config);

  return {
    canvas: PREVIEW_CANVAS,
    frames,
    path,
    strokeDasharray: getStrokeDash(config.strokeStyle),
    color: config.color,
    opacity: config.opacity / 100,
    strokeWidth: config.strokeWidth,
    arrowheads,
    label
  };
}

function calculateConnectionPoints(frame1: Rect, frame2: Rect, config: ConnectionConfig): ConnectionPoints {
  const frame1Center = centerOf(frame1);
  const frame2Center = centerOf(frame2);

  let startPoint: Point;
  let startOffsetPoint: Point;

  if (config.startPosition === 'auto') {
    const dx = frame2Center.x - frame1Center.x;
    const dy = frame2Center.y - frame1Center.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        startPoint = { x: frame1.x + frame1.width, y: frame1Center.y };
        startOffsetPoint = { x: startPoint.x + config.connectionOffset, y: startPoint.y };
      } else {
        startPoint = { x: frame1.x, y: frame1Center.y };
        startOffsetPoint = { x: startPoint.x - config.connectionOffset, y: startPoint.y };
      }
    } else {
      if (dy > 0) {
        startPoint = { x: frame1Center.x, y: frame1.y + frame1.height };
        startOffsetPoint = { x: startPoint.x, y: startPoint.y + config.connectionOffset };
      } else {
        startPoint = { x: frame1Center.x, y: frame1.y };
        startOffsetPoint = { x: startPoint.x, y: startPoint.y - config.connectionOffset };
      }
    }
  } else {
    const start = calculateExplicitPosition(frame1, config.startPosition, config.connectionOffset);
    startPoint = start.point;
    startOffsetPoint = start.offsetPoint;
  }

  let endPoint: Point;
  let endOffsetPoint: Point;

  if (config.endPosition === 'auto') {
    const dx = frame2Center.x - frame1Center.x;
    const dy = frame2Center.y - frame1Center.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        endPoint = { x: frame2.x, y: frame2Center.y };
        endOffsetPoint = { x: endPoint.x - config.connectionOffset, y: endPoint.y };
      } else {
        endPoint = { x: frame2.x + frame2.width, y: frame2Center.y };
        endOffsetPoint = { x: endPoint.x + config.connectionOffset, y: endPoint.y };
      }
    } else {
      if (dy > 0) {
        endPoint = { x: frame2Center.x, y: frame2.y };
        endOffsetPoint = { x: endPoint.x, y: endPoint.y - config.connectionOffset };
      } else {
        endPoint = { x: frame2Center.x, y: frame2.y + frame2.height };
        endOffsetPoint = { x: endPoint.x, y: endPoint.y + config.connectionOffset };
      }
    }
  } else {
    const end = calculateExplicitPosition(frame2, config.endPosition, config.connectionOffset);
    endPoint = end.point;
    endOffsetPoint = end.offsetPoint;
  }

  if (config.connectionOffset === 0) {
    startOffsetPoint = { ...startPoint };
    endOffsetPoint = { ...endPoint };
  }

  const waypoints = calculateAvoidanceRoute(frame1, frame2, startOffsetPoint, endOffsetPoint, config);

  return {
    startPoint,
    endPoint,
    startOffsetPoint,
    endOffsetPoint,
    waypoints
  };
}

function calculateExplicitPosition(frame: Rect, position: ConnectionConfig['startPosition'], offset: number) {
  const center = centerOf(frame);

  switch (position) {
    case 'top':
      return {
        point: { x: center.x, y: frame.y },
        offsetPoint: { x: center.x, y: frame.y - offset }
      };
    case 'right':
      return {
        point: { x: frame.x + frame.width, y: center.y },
        offsetPoint: { x: frame.x + frame.width + offset, y: center.y }
      };
    case 'bottom':
      return {
        point: { x: center.x, y: frame.y + frame.height },
        offsetPoint: { x: center.x, y: frame.y + frame.height + offset }
      };
    case 'left':
      return {
        point: { x: frame.x, y: center.y },
        offsetPoint: { x: frame.x - offset, y: center.y }
      };
    default:
      return {
        point: { ...center },
        offsetPoint: { ...center }
      };
  }
}

function calculateAvoidanceRoute(
  frame1: Rect,
  frame2: Rect,
  startPoint: Point,
  endPoint: Point,
  config: ConnectionConfig
): Point[] {
  if (!config.avoidOverlap) return [];

  const directHitsFrame1 = lineIntersectsRect(startPoint, endPoint, frame1);
  const directHitsFrame2 = lineIntersectsRect(startPoint, endPoint, frame2);

  if (!directHitsFrame1 && !directHitsFrame2) {
    return [];
  }

  const dx = Math.abs(endPoint.x - startPoint.x);
  const dy = Math.abs(endPoint.y - startPoint.y);
  const horizontalPrimary = dx > dy;

  const clearance = config.connectionOffset + 20;

  if (horizontalPrimary) {
    const frame1Bottom = frame1.y + frame1.height;
    const frame2Bottom = frame2.y + frame2.height;
    const frame1Top = frame1.y;
    const frame2Top = frame2.y;

    const routeAboveY = Math.min(frame1Top, frame2Top) - clearance;
    const routeBelowY = Math.max(frame1Bottom, frame2Bottom) + clearance;
    const avgY = (startPoint.y + endPoint.y) / 2;
    const routeY = Math.abs(routeAboveY - avgY) < Math.abs(routeBelowY - avgY) ? routeAboveY : routeBelowY;

    return [
      { x: startPoint.x, y: routeY },
      { x: endPoint.x, y: routeY }
    ];
  }

  const frame1Right = frame1.x + frame1.width;
  const frame2Right = frame2.x + frame2.width;
  const frame1Left = frame1.x;
  const frame2Left = frame2.x;

  const routeLeftX = Math.min(frame1Left, frame2Left) - clearance;
  const routeRightX = Math.max(frame1Right, frame2Right) + clearance;
  const avgX = (startPoint.x + endPoint.x) / 2;
  const routeX = Math.abs(routeLeftX - avgX) < Math.abs(routeRightX - avgX) ? routeLeftX : routeRightX;

  return [
    { x: routeX, y: startPoint.y },
    { x: routeX, y: endPoint.y }
  ];
}

function createPathData(points: ConnectionPoints, config: ConnectionConfig): string {
  const { startPoint, endPoint, startOffsetPoint, endOffsetPoint, waypoints } = points;

  if (waypoints.length > 0) {
    const segments: string[] = [`M ${startPoint.x} ${startPoint.y}`];

    if (config.connectionOffset > 0) {
      segments.push(`L ${startOffsetPoint.x} ${startOffsetPoint.y}`);
    }

    for (const waypoint of waypoints) {
      segments.push(`L ${waypoint.x} ${waypoint.y}`);
    }

    if (config.connectionOffset > 0) {
      segments.push(`L ${endOffsetPoint.x} ${endOffsetPoint.y}`);
    }

    segments.push(`L ${endPoint.x} ${endPoint.y}`);
    return segments.join(' ');
  }

  if (config.arrowType === 'straight') {
    if (config.connectionOffset > 0) {
      return `M ${startPoint.x} ${startPoint.y} L ${startOffsetPoint.x} ${startOffsetPoint.y} L ${endOffsetPoint.x} ${endOffsetPoint.y} L ${endPoint.x} ${endPoint.y}`;
    }
    return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
  }

  if (config.arrowType === 'elbow') {
    if (config.connectionOffset > 0) {
      const midX = (startOffsetPoint.x + endOffsetPoint.x) / 2;
      const midY = (startOffsetPoint.y + endOffsetPoint.y) / 2;
      return `M ${startPoint.x} ${startPoint.y} L ${startOffsetPoint.x} ${startOffsetPoint.y} L ${midX} ${startOffsetPoint.y} L ${midX} ${endOffsetPoint.y} L ${endOffsetPoint.x} ${endOffsetPoint.y} L ${endPoint.x} ${endPoint.y}`;
    }
    const midX = (startPoint.x + endPoint.x) / 2;
    return `M ${startPoint.x} ${startPoint.y} L ${midX} ${startPoint.y} L ${midX} ${endPoint.y} L ${endPoint.x} ${endPoint.y}`;
  }

  if (config.connectionOffset > 0) {
    const dx = endOffsetPoint.x - startOffsetPoint.x;
    const dy = endOffsetPoint.y - startOffsetPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const curvature = distance * 0.3;

    const controlPoint1 = {
      x: startOffsetPoint.x + (Math.abs(dx) > Math.abs(dy) ? curvature : 0),
      y: startOffsetPoint.y + (Math.abs(dy) > Math.abs(dx) ? curvature * Math.sign(dy) : 0)
    };

    const controlPoint2 = {
      x: endOffsetPoint.x - (Math.abs(dx) > Math.abs(dy) ? curvature : 0),
      y: endOffsetPoint.y - (Math.abs(dy) > Math.abs(dx) ? curvature * Math.sign(dy) : 0)
    };

    return `M ${startPoint.x} ${startPoint.y} L ${startOffsetPoint.x} ${startOffsetPoint.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${endOffsetPoint.x} ${endOffsetPoint.y} L ${endPoint.x} ${endPoint.y}`;
  }

  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const curvature = distance * 0.3;

  const controlPoint1 = {
    x: startPoint.x + (Math.abs(dx) > Math.abs(dy) ? curvature : 0),
    y: startPoint.y + (Math.abs(dy) > Math.abs(dx) ? curvature * Math.sign(dy) : 0)
  };

  const controlPoint2 = {
    x: endPoint.x - (Math.abs(dx) > Math.abs(dy) ? curvature : 0),
    y: endPoint.y - (Math.abs(dy) > Math.abs(dx) ? curvature * Math.sign(dy) : 0)
  };

  return `M ${startPoint.x} ${startPoint.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${endPoint.x} ${endPoint.y}`;
}

function calculateArrowAngles(points: ConnectionPoints, config: ConnectionConfig) {
  const { startPoint, endPoint, startOffsetPoint, endOffsetPoint } = points;

  const endAngle = config.connectionOffset > 0
    ? Math.atan2(endPoint.y - endOffsetPoint.y, endPoint.x - endOffsetPoint.x)
    : Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

  const startAngle = config.connectionOffset > 0
    ? Math.atan2(startOffsetPoint.y - startPoint.y, startOffsetPoint.x - startPoint.x)
    : Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

  return { startAngle, endAngle };
}

function toArrowPolygon(point: Point, angle: number): string {
  const p1 = {
    x: point.x - ARROW_LENGTH * Math.cos(angle - ARROW_ANGLE),
    y: point.y - ARROW_LENGTH * Math.sin(angle - ARROW_ANGLE)
  };
  const p2 = {
    x: point.x - ARROW_LENGTH * Math.cos(angle + ARROW_ANGLE),
    y: point.y - ARROW_LENGTH * Math.sin(angle + ARROW_ANGLE)
  };

  return `M ${p1.x} ${p1.y} L ${point.x} ${point.y} L ${p2.x} ${p2.y} Z`;
}

function buildLabelGeometry(points: ConnectionPoints, config: ConnectionConfig): PreviewGeometry['label'] {
  if (!config.label.trim()) return null;

  const position = calculateLabelPosition(
    points.startPoint,
    points.endPoint,
    points.startOffsetPoint,
    points.endOffsetPoint,
    points.waypoints,
    config
  );

  const estimatedTextWidth = Math.max(
    24,
    config.label.length * (config.labelFontSize * 0.6)
  );

  const width = estimatedTextWidth + config.labelPadding * 2;
  const height = config.labelFontSize + config.labelPadding * 2;

  return {
    rect: {
      x: position.x - width / 2,
      y: position.y - height / 2,
      width,
      height
    },
    text: config.label,
    fontSize: config.labelFontSize,
    textColor: config.labelTextColor,
    background: config.labelBg,
    borderColor: config.labelBorderColor,
    borderWidth: config.labelBorderWidth,
    borderRadius: config.labelBorderRadius,
    padding: config.labelPadding
  };
}

function calculateLabelPosition(
  startPoint: Point,
  endPoint: Point,
  startOffsetPoint: Point,
  endOffsetPoint: Point,
  waypoints: Point[],
  config: ConnectionConfig
): Point {
  const safeStartPoint = {
    x: isNaN(startPoint.x) ? 0 : startPoint.x,
    y: isNaN(startPoint.y) ? 0 : startPoint.y
  };
  const safeEndPoint = {
    x: isNaN(endPoint.x) ? 100 : endPoint.x,
    y: isNaN(endPoint.y) ? 100 : endPoint.y
  };
  const safeStartOffsetPoint = {
    x: isNaN(startOffsetPoint?.x) ? safeStartPoint.x : startOffsetPoint.x,
    y: isNaN(startOffsetPoint?.y) ? safeStartPoint.y : startOffsetPoint.y
  };
  const safeEndOffsetPoint = {
    x: isNaN(endOffsetPoint?.x) ? safeEndPoint.x : endOffsetPoint.x,
    y: isNaN(endOffsetPoint?.y) ? safeEndPoint.y : endOffsetPoint.y
  };

  const pathPoints: Point[] = [safeStartPoint];

  if (config.connectionOffset > 0) {
    pathPoints.push(safeStartOffsetPoint);
  }

  if (waypoints && waypoints.length > 0) {
    for (const waypoint of waypoints) {
      if (!isNaN(waypoint.x) && !isNaN(waypoint.y)) {
        pathPoints.push(waypoint);
      }
    }
  }

  if (config.connectionOffset > 0) {
    pathPoints.push(safeEndOffsetPoint);
  }

  pathPoints.push(safeEndPoint);

  let totalLength = 0;
  const segments: Array<{ start: Point; end: Point; length: number }> = [];

  for (let i = 0; i < pathPoints.length - 1; i += 1) {
    const start = pathPoints[i];
    const end = pathPoints[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      segments.push({ start, end, length });
      totalLength += length;
    }
  }

  if (segments.length === 0 || totalLength === 0) {
    const fallbackCenter = {
      x: (safeStartPoint.x + safeEndPoint.x) / 2,
      y: (safeStartPoint.y + safeEndPoint.y) / 2
    };

    if (config.labelPosition === 'top') {
      return { x: fallbackCenter.x, y: fallbackCenter.y - (config.labelOffset || 10) };
    }

    if (config.labelPosition === 'bottom') {
      return { x: fallbackCenter.x, y: fallbackCenter.y + (config.labelOffset || 10) };
    }

    return fallbackCenter;
  }

  const halfLength = totalLength / 2;
  let currentLength = 0;
  let pathCenter = { x: 0, y: 0 };
  let pathAngle = 0;

  for (const segment of segments) {
    if (currentLength + segment.length >= halfLength) {
      const remainingLength = halfLength - currentLength;
      const ratio = segment.length > 0 ? remainingLength / segment.length : 0;

      pathCenter = {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio
      };

      pathAngle = Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x);
      break;
    }
    currentLength += segment.length;
  }

  if (isNaN(pathCenter.x) || isNaN(pathCenter.y)) {
    pathCenter = {
      x: (safeStartPoint.x + safeEndPoint.x) / 2,
      y: (safeStartPoint.y + safeEndPoint.y) / 2
    };
    pathAngle = Math.atan2(safeEndPoint.y - safeStartPoint.y, safeEndPoint.x - safeStartPoint.x);
  }

  if (config.labelPosition === 'center') {
    return pathCenter;
  }

  const offsetDistance = config.labelOffset || 10;
  let finalPosition = pathCenter;

  if (config.labelPosition === 'top') {
    finalPosition = {
      x: pathCenter.x - Math.cos(pathAngle) * offsetDistance,
      y: pathCenter.y - Math.sin(pathAngle) * offsetDistance
    };
  } else if (config.labelPosition === 'bottom') {
    finalPosition = {
      x: pathCenter.x + Math.cos(pathAngle) * offsetDistance,
      y: pathCenter.y + Math.sin(pathAngle) * offsetDistance
    };
  }

  return {
    x: isNaN(finalPosition.x) ? pathCenter.x : finalPosition.x,
    y: isNaN(finalPosition.y) ? pathCenter.y : finalPosition.y
  };
}

function getStrokeDash(style: ConnectionConfig['strokeStyle']) {
  if (style === 'dashed') return '5 5';
  if (style === 'dotted') return '2 3';
  return undefined;
}

function addSloppiness(path: string, config: ConnectionConfig): string {
  if (config.sloppiness === 'none') return path;

  const slopAmount = config.sloppiness === 'low' ? 2 : 5;
  const random = seededRandom(hashConfig(config));

  return path.replace(/-?\d+\.?\d*/g, (match) => {
    const num = parseFloat(match);
    if (Number.isNaN(num)) return match;
    const variation = (random() - 0.5) * slopAmount;
    return (num + variation).toFixed(1);
  });
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function hashConfig(config: ConnectionConfig) {
  const str = [
    config.color,
    config.strokeWidth,
    config.strokeStyle,
    config.sloppiness,
    config.arrowType,
    config.arrowheads,
    config.startPosition,
    config.endPosition,
    config.connectionOffset,
    config.avoidOverlap,
    config.label,
    config.labelPosition,
    config.labelOffset
  ].join('|');

  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function lineIntersectsRect(start: Point, end: Point, rect: Rect) {
  const padding = 8;
  const expanded = {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2
  };

  const rectLeft = expanded.x;
  const rectRight = expanded.x + expanded.width;
  const rectTop = expanded.y;
  const rectBottom = expanded.y + expanded.height;

  if ((start.x < rectLeft && end.x < rectLeft) ||
      (start.x > rectRight && end.x > rectRight) ||
      (start.y < rectTop && end.y < rectTop) ||
      (start.y > rectBottom && end.y > rectBottom)) {
    return false;
  }

  const lineLeft = Math.min(start.x, end.x);
  const lineRight = Math.max(start.x, end.x);
  const lineTop = Math.min(start.y, end.y);
  const lineBottom = Math.max(start.y, end.y);

  return !(lineRight < rectLeft || lineLeft > rectRight || lineBottom < rectTop || lineTop > rectBottom);
}

function centerOf(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}
