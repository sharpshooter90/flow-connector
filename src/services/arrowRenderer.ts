import { ConnectionConfig, Point } from "../types/plugin";
import { hexToRgb } from "../utils/helpers";

export class ArrowRenderer {
  createArrowHead(
    endPoint: Point,
    angle: number,
    config: ConnectionConfig
  ): VectorNode | null {
    if (config.arrowheads === "none") return null;

    const arrowLength = 12;
    const arrowAngle = Math.PI / 6; // 30 degrees

    const arrowPoint1 = {
      x: endPoint.x - arrowLength * Math.cos(angle - arrowAngle),
      y: endPoint.y - arrowLength * Math.sin(angle - arrowAngle),
    };

    const arrowPoint2 = {
      x: endPoint.x - arrowLength * Math.cos(angle + arrowAngle),
      y: endPoint.y - arrowLength * Math.sin(angle + arrowAngle),
    };

    const arrowHead = figma.createVector();

    arrowHead.vectorPaths = [
      {
        windingRule: "NONZERO",
        data: `M ${arrowPoint1.x} ${arrowPoint1.y} L ${endPoint.x} ${endPoint.y} L ${arrowPoint2.x} ${arrowPoint2.y}`,
      },
    ];

    const color = hexToRgb(config.color);
    arrowHead.strokes = [
      { type: "SOLID", color, opacity: config.opacity / 100 },
    ];
    arrowHead.strokeWeight = config.strokeWidth;

    // Apply stroke cap and join settings
    arrowHead.strokeCap =
      config.strokeCap === "none"
        ? "NONE"
        : config.strokeCap === "round"
        ? "ROUND"
        : "SQUARE";
    arrowHead.strokeJoin =
      config.strokeJoin === "miter"
        ? "MITER"
        : config.strokeJoin === "round"
        ? "ROUND"
        : "BEVEL";

    return arrowHead;
  }

  createStartArrowHead(
    startPoint: Point,
    angle: number,
    config: ConnectionConfig
  ): VectorNode | null {
    if (config.arrowheads !== "both") return null;

    const arrowLength = 12;
    const arrowAngle = Math.PI / 6; // 30 degrees
    const reverseAngle = angle + Math.PI; // Point in opposite direction

    const arrowPoint1 = {
      x: startPoint.x - arrowLength * Math.cos(reverseAngle - arrowAngle),
      y: startPoint.y - arrowLength * Math.sin(reverseAngle - arrowAngle),
    };

    const arrowPoint2 = {
      x: startPoint.x - arrowLength * Math.cos(reverseAngle + arrowAngle),
      y: startPoint.y - arrowLength * Math.sin(reverseAngle + arrowAngle),
    };

    const arrowHead = figma.createVector();

    arrowHead.vectorPaths = [
      {
        windingRule: "NONZERO",
        data: `M ${arrowPoint1.x} ${arrowPoint1.y} L ${startPoint.x} ${startPoint.y} L ${arrowPoint2.x} ${arrowPoint2.y}`,
      },
    ];

    const color = hexToRgb(config.color);
    arrowHead.strokes = [
      { type: "SOLID", color, opacity: config.opacity / 100 },
    ];
    arrowHead.strokeWeight = config.strokeWidth;

    // Apply stroke cap and join settings
    arrowHead.strokeCap =
      config.strokeCap === "none"
        ? "NONE"
        : config.strokeCap === "round"
        ? "ROUND"
        : "SQUARE";
    arrowHead.strokeJoin =
      config.strokeJoin === "miter"
        ? "MITER"
        : config.strokeJoin === "round"
        ? "ROUND"
        : "BEVEL";

    return arrowHead;
  }
}
