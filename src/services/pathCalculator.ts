import { ConnectionConfig, Point, ConnectionPoints } from '../types/plugin';
import { lineIntersectsRect } from '../utils/helpers';

export class PathCalculator {
  calculateConnectionPoints(frame1: FrameNode, frame2: FrameNode, config: ConnectionConfig): ConnectionPoints {
    const frame1Center = {
      x: frame1.x + frame1.width / 2,
      y: frame1.y + frame1.height / 2
    };

    const frame2Center = {
      x: frame2.x + frame2.width / 2,
      y: frame2.y + frame2.height / 2
    };

    let startPoint: Point, endPoint: Point, startOffsetPoint: Point, endOffsetPoint: Point;

    // Calculate start point
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
      const result = this.calculatePositionPoint(frame1, config.startPosition, config.connectionOffset);
      startPoint = result.point;
      startOffsetPoint = result.offsetPoint;
    }

    // Calculate end point
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
      const result = this.calculatePositionPoint(frame2, config.endPosition, config.connectionOffset);
      endPoint = result.point;
      endOffsetPoint = result.offsetPoint;
    }

    const avoidanceRoute = this.calculateAvoidanceRoute(frame1, frame2, startOffsetPoint, endOffsetPoint, config);

    return {
      startPoint,
      endPoint,
      startOffsetPoint,
      endOffsetPoint,
      waypoints: avoidanceRoute.waypoints
    };
  }

  private calculatePositionPoint(frame: FrameNode, position: string, offset: number) {
    const center = {
      x: frame.x + frame.width / 2,
      y: frame.y + frame.height / 2
    };

    let point: Point;
    let offsetPoint: Point;

    switch (position) {
      case 'top':
        point = { x: center.x, y: frame.y };
        offsetPoint = { x: point.x, y: point.y - offset };
        break;
      case 'right':
        point = { x: frame.x + frame.width, y: center.y };
        offsetPoint = { x: point.x + offset, y: point.y };
        break;
      case 'bottom':
        point = { x: center.x, y: frame.y + frame.height };
        offsetPoint = { x: point.x, y: point.y + offset };
        break;
      case 'left':
        point = { x: frame.x, y: center.y };
        offsetPoint = { x: point.x - offset, y: point.y };
        break;
      default:
        point = center;
        offsetPoint = center;
    }

    return { point, offsetPoint };
  }

  private calculateAvoidanceRoute(
    frame1: FrameNode, 
    frame2: FrameNode, 
    startPoint: Point, 
    endPoint: Point, 
    config: ConnectionConfig
  ) {
    if (!config.avoidOverlap) {
      return { startPoint, endPoint, waypoints: [] };
    }

    const frame1Rect = { x: frame1.x, y: frame1.y, width: frame1.width, height: frame1.height };
    const frame2Rect = { x: frame2.x, y: frame2.y, width: frame2.width, height: frame2.height };

    const directPathIntersectsFrame1 = lineIntersectsRect(startPoint, endPoint, frame1Rect);
    const directPathIntersectsFrame2 = lineIntersectsRect(startPoint, endPoint, frame2Rect);

    if (!directPathIntersectsFrame1 && !directPathIntersectsFrame2) {
      return { startPoint, endPoint, waypoints: [] };
    }

    const dx = Math.abs(endPoint.x - startPoint.x);
    const dy = Math.abs(endPoint.y - startPoint.y);
    const isHorizontalPrimary = dx > dy;

    let waypoints: Point[] = [];

    if (isHorizontalPrimary) {
      const frame1Bottom = frame1.y + frame1.height;
      const frame1Top = frame1.y;
      const frame2Bottom = frame2.y + frame2.height;
      const frame2Top = frame2.y;

      const maxBottom = Math.max(frame1Bottom, frame2Bottom);
      const minTop = Math.min(frame1Top, frame2Top);
      const clearance = config.connectionOffset + 20;

      const routeAboveY = minTop - clearance;
      const routeBelowY = maxBottom + clearance;

      const avgY = (startPoint.y + endPoint.y) / 2;
      const useAbove = Math.abs(routeAboveY - avgY) < Math.abs(routeBelowY - avgY);
      const routeY = useAbove ? routeAboveY : routeBelowY;

      waypoints = [
        { x: startPoint.x, y: routeY },
        { x: endPoint.x, y: routeY }
      ];
    } else {
      const frame1Right = frame1.x + frame1.width;
      const frame1Left = frame1.x;
      const frame2Right = frame2.x + frame2.width;
      const frame2Left = frame2.x;

      const maxRight = Math.max(frame1Right, frame2Right);
      const minLeft = Math.min(frame1Left, frame2Left);
      const clearance = config.connectionOffset + 20;

      const routeLeftX = minLeft - clearance;
      const routeRightX = maxRight + clearance;

      const avgX = (startPoint.x + endPoint.x) / 2;
      const useLeft = Math.abs(routeLeftX - avgX) < Math.abs(routeRightX - avgX);
      const routeX = useLeft ? routeLeftX : routeRightX;

      waypoints = [
        { x: routeX, y: startPoint.y },
        { x: routeX, y: endPoint.y }
      ];
    }

    return { startPoint, endPoint, waypoints };
  }
}