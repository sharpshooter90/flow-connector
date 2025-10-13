import { ConnectionConfig, Point } from '../types/plugin';

export class PathRenderer {
  createCurvedPath(
    startPoint: Point, 
    endPoint: Point, 
    startOffsetPoint: Point, 
    endOffsetPoint: Point, 
    waypoints: Point[], 
    config: ConnectionConfig
  ): string {
    if (waypoints.length > 0) {
      let pathData = `M ${startPoint.x} ${startPoint.y}`;

      if (config.connectionOffset > 0) {
        pathData += ` L ${startOffsetPoint.x} ${startOffsetPoint.y}`;
      }

      for (const waypoint of waypoints) {
        pathData += ` L ${waypoint.x} ${waypoint.y}`;
      }

      if (config.connectionOffset > 0) {
        pathData += ` L ${endOffsetPoint.x} ${endOffsetPoint.y}`;
      }

      pathData += ` L ${endPoint.x} ${endPoint.y}`;
      return pathData;
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
      } else {
        const midX = (startPoint.x + endPoint.x) / 2;
        return `M ${startPoint.x} ${startPoint.y} L ${midX} ${startPoint.y} L ${midX} ${endPoint.y} L ${endPoint.x} ${endPoint.y}`;
      }
    }

    // Curved path
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
    } else {
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
  }

  addSloppiness(path: string, config: ConnectionConfig): string {
    if (config.sloppiness === 'none') return path;

    const slopAmount = config.sloppiness === 'low' ? 2 : 5;

    return path.replace(/(\d+\.?\d*)/g, (match) => {
      const num = parseFloat(match);
      const variation = (Math.random() - 0.5) * slopAmount;
      return (num + variation).toFixed(1);
    });
  }
}