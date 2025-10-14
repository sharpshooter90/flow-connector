import {
  ConnectionConfig,
  ConnectionMetadata,
  ConnectionPoints,
} from "../types/plugin";
import { CONNECTION_PREFIX, PLUGIN_VERSION } from "../utils/constants";
import { hexToRgb } from "../utils/helpers";
import { PathCalculator } from "./pathCalculator";
import { PathRenderer } from "./pathRenderer";
import { ArrowRenderer } from "./arrowRenderer";
import { LabelRenderer } from "./labelRenderer";
import { ConnectionManager } from "./connectionManager";

export class ConnectionCreator {
  private pathCalculator = new PathCalculator();
  private pathRenderer = new PathRenderer();
  private arrowRenderer = new ArrowRenderer();
  private labelRenderer = new LabelRenderer();
  private connectionManager = new ConnectionManager();

  async createConnection(
    frame1: FrameNode,
    frame2: FrameNode,
    config: ConnectionConfig
  ): Promise<GroupNode> {
    const connectionPoints = this.pathCalculator.calculateConnectionPoints(
      frame1,
      frame2,
      config
    );

    const line = this.createMainLine(frame1, frame2, connectionPoints, config);
    const elements: SceneNode[] = [line];

    // Create arrow heads
    const { endAngle, startAngle } = this.calculateArrowAngles(
      connectionPoints,
      config
    );

    const endArrowHead = this.arrowRenderer.createArrowHead(
      connectionPoints.endPoint,
      endAngle,
      config
    );
    if (endArrowHead) {
      endArrowHead.name = "End Arrow Head";
      elements.push(endArrowHead);
    }

    const startArrowHead = this.arrowRenderer.createStartArrowHead(
      connectionPoints.startPoint,
      startAngle,
      config
    );
    if (startArrowHead) {
      startArrowHead.name = "Start Arrow Head";
      elements.push(startArrowHead);
    }

    // Create label
    const labelFrame = await this.createConnectionLabel(
      connectionPoints,
      config
    );
    if (labelFrame) elements.push(labelFrame);

    // Group all elements
    const group = figma.group(elements, figma.currentPage);
    group.name = `${CONNECTION_PREFIX} ${frame1.name} → ${frame2.name}`;

    // Store metadata
    const metadata: ConnectionMetadata = {
      config,
      frame1Id: frame1.id,
      frame2Id: frame2.id,
      version: PLUGIN_VERSION,
    };

    this.connectionManager.setConnectionMetadata(group, metadata);
    this.connectionManager.addTrackedConnection(group.id, metadata);

    figma.currentPage.appendChild(group);
    return group;
  }

  private createMainLine(
    frame1: FrameNode,
    frame2: FrameNode,
    connectionPoints: ConnectionPoints,
    config: ConnectionConfig
  ): VectorNode {
    const line = figma.createVector();

    let pathData = this.pathRenderer.createCurvedPath(
      connectionPoints.startPoint,
      connectionPoints.endPoint,
      connectionPoints.startOffsetPoint,
      connectionPoints.endOffsetPoint,
      connectionPoints.waypoints,
      config
    );

    pathData = this.pathRenderer.addSloppiness(pathData, config);

    line.vectorPaths = [
      {
        windingRule: "NONZERO",
        data: pathData,
      },
    ];

    const color = hexToRgb(config.color);
    const strokeStyle =
      config.strokeStyle === "dashed"
        ? [5, 5]
        : config.strokeStyle === "dotted"
        ? [2, 3]
        : [];

    line.strokes = [
      {
        type: "SOLID",
        color,
        opacity: config.opacity / 100,
      },
    ];

    line.strokeWeight = config.strokeWidth;

    // Apply stroke cap and join settings
    line.strokeCap =
      config.strokeCap === "none"
        ? "NONE"
        : config.strokeCap === "round"
        ? "ROUND"
        : "SQUARE";
    line.strokeJoin =
      config.strokeJoin === "miter"
        ? "MITER"
        : config.strokeJoin === "round"
        ? "ROUND"
        : "BEVEL";

    if (strokeStyle.length > 0) {
      line.dashPattern = strokeStyle;
    }

    line.name = `Connection: ${frame1.name} → ${frame2.name}`;

    return line;
  }

  private calculateArrowAngles(
    connectionPoints: ConnectionPoints,
    config: ConnectionConfig
  ) {
    const endAngle =
      config.connectionOffset > 0
        ? Math.atan2(
            connectionPoints.endPoint.y - connectionPoints.endOffsetPoint.y,
            connectionPoints.endPoint.x - connectionPoints.endOffsetPoint.x
          )
        : Math.atan2(
            connectionPoints.endPoint.y - connectionPoints.startPoint.y,
            connectionPoints.endPoint.x - connectionPoints.startPoint.x
          );

    const startAngle =
      config.connectionOffset > 0
        ? Math.atan2(
            connectionPoints.startOffsetPoint.y - connectionPoints.startPoint.y,
            connectionPoints.startOffsetPoint.x - connectionPoints.startPoint.x
          )
        : Math.atan2(
            connectionPoints.endPoint.y - connectionPoints.startPoint.y,
            connectionPoints.endPoint.x - connectionPoints.startPoint.x
          );

    return { endAngle, startAngle };
  }

  private async createConnectionLabel(
    connectionPoints: ConnectionPoints,
    config: ConnectionConfig
  ) {
    const labelPosition = this.labelRenderer.calculateLabelPosition(
      connectionPoints.startPoint,
      connectionPoints.endPoint,
      connectionPoints.startOffsetPoint,
      connectionPoints.endOffsetPoint,
      connectionPoints.waypoints,
      config
    );

    return await this.labelRenderer.createLabel(config, labelPosition);
  }
}
