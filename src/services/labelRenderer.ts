import { ConnectionConfig, Point } from "../types/plugin";
import { hexToRgb } from "../utils/helpers";

export class LabelRenderer {
  calculateLabelPosition(
    startPoint: Point,
    endPoint: Point,
    startOffsetPoint: Point,
    endOffsetPoint: Point,
    waypoints: Point[],
    config: ConnectionConfig
  ): Point {
    const safeStartPoint = {
      x: isNaN(startPoint.x) ? 0 : startPoint.x,
      y: isNaN(startPoint.y) ? 0 : startPoint.y,
    };
    const safeEndPoint = {
      x: isNaN(endPoint.x) ? 100 : endPoint.x,
      y: isNaN(endPoint.y) ? 100 : endPoint.y,
    };
    const safeStartOffsetPoint = {
      x: isNaN(startOffsetPoint?.x) ? safeStartPoint.x : startOffsetPoint.x,
      y: isNaN(startOffsetPoint?.y) ? safeStartPoint.y : startOffsetPoint.y,
    };
    const safeEndOffsetPoint = {
      x: isNaN(endOffsetPoint?.x) ? safeEndPoint.x : endOffsetPoint.x,
      y: isNaN(endOffsetPoint?.y) ? safeEndPoint.y : endOffsetPoint.y,
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
    const segments: { start: Point; end: Point; length: number }[] = [];

    for (let i = 0; i < pathPoints.length - 1; i++) {
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
        y: (safeStartPoint.y + safeEndPoint.y) / 2,
      };

      if (config.labelPosition === "top") {
        return {
          x: fallbackCenter.x,
          y: fallbackCenter.y - (config.labelOffset || 10),
        };
      } else if (config.labelPosition === "bottom") {
        return {
          x: fallbackCenter.x,
          y: fallbackCenter.y + (config.labelOffset || 10),
        };
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
          y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
        };

        pathAngle = Math.atan2(
          segment.end.y - segment.start.y,
          segment.end.x - segment.start.x
        );
        break;
      }
      currentLength += segment.length;
    }

    if (isNaN(pathCenter.x) || isNaN(pathCenter.y)) {
      pathCenter = {
        x: (safeStartPoint.x + safeEndPoint.x) / 2,
        y: (safeStartPoint.y + safeEndPoint.y) / 2,
      };
      pathAngle = Math.atan2(
        safeEndPoint.y - safeStartPoint.y,
        safeEndPoint.x - safeStartPoint.x
      );
    }

    if (config.labelPosition === "center") {
      return pathCenter;
    }

    const offsetDistance = config.labelOffset || 10;
    let finalPosition = pathCenter;

    if (config.labelPosition === "top") {
      finalPosition = {
        x: pathCenter.x - Math.cos(pathAngle) * offsetDistance,
        y: pathCenter.y - Math.sin(pathAngle) * offsetDistance,
      };
    } else if (config.labelPosition === "bottom") {
      finalPosition = {
        x: pathCenter.x + Math.cos(pathAngle) * offsetDistance,
        y: pathCenter.y + Math.sin(pathAngle) * offsetDistance,
      };
    }

    return {
      x: isNaN(finalPosition.x) ? pathCenter.x : finalPosition.x,
      y: isNaN(finalPosition.y) ? pathCenter.y : finalPosition.y,
    };
  }

  async createLabel(
    config: ConnectionConfig,
    position: Point
  ): Promise<FrameNode | null> {
    if (!config.label.trim()) return null;

    try {
      // Load the specified font family and weight
      const fontFamily = config.labelFontFamily || "Inter";
      const fontWeight = config.labelFontWeight || "Regular";

      try {
        await figma.loadFontAsync({ family: fontFamily, style: fontWeight });
      } catch (error) {
        console.warn(
          `Failed to load font ${fontFamily} ${fontWeight}, falling back to Inter Regular`
        );
        try {
          await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        } catch (fallbackError) {
          await figma.loadFontAsync({ family: "Helvetica", style: "Regular" });
        }
      }

      const label = figma.createText();
      label.characters = config.label;
      label.fontSize = config.labelFontSize;

      // Set font family and weight
      try {
        label.fontName = { family: fontFamily, style: fontWeight };
      } catch (error) {
        console.warn(
          `Failed to set font to ${fontFamily} ${fontWeight}, using default`
        );
      }

      label.fills = [{ type: "SOLID", color: hexToRgb(config.labelTextColor) }];

      const labelFrame = figma.createFrame();
      labelFrame.name = "Connection Label";

      labelFrame.layoutMode = "HORIZONTAL";
      labelFrame.primaryAxisSizingMode = "AUTO";
      labelFrame.counterAxisSizingMode = "AUTO";
      labelFrame.paddingLeft = config.labelPadding;
      labelFrame.paddingRight = config.labelPadding;
      labelFrame.paddingTop = config.labelPadding;
      labelFrame.paddingBottom = config.labelPadding;

      labelFrame.fills = [{ type: "SOLID", color: hexToRgb(config.labelBg) }];

      if (config.labelBorderWidth > 0) {
        labelFrame.strokes = [
          { type: "SOLID", color: hexToRgb(config.labelBorderColor) },
        ];
        labelFrame.strokeWeight = config.labelBorderWidth;
      }

      if (config.labelBorderRadius > 0) {
        labelFrame.cornerRadius = config.labelBorderRadius;
      }

      labelFrame.appendChild(label);

      labelFrame.x = position.x - labelFrame.width / 2;
      labelFrame.y = position.y - labelFrame.height / 2;

      return labelFrame;
    } catch (error) {
      console.error("Failed to create label:", error);
      return null;
    }
  }
}
