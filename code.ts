// Flow Connector Plugin - Creates configurable arrows between selected frames

interface ConnectionConfig {
  color: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  sloppiness: 'none' | 'low' | 'high';
  arrowType: 'straight' | 'curved' | 'elbow';
  arrowheads: 'none' | 'end' | 'both';
  startPosition: 'auto' | 'top' | 'right' | 'bottom' | 'left';
  endPosition: 'auto' | 'top' | 'right' | 'bottom' | 'left';
  connectionOffset: number;
  avoidOverlap: boolean;
  opacity: number;
  label: string;
  labelPosition: 'center' | 'top' | 'bottom';
  labelOffset: number;
  labelBg: string;
  labelTextColor: string;
  labelBorderColor: string;
  labelBorderWidth: number;
  labelBorderRadius: number;
  labelPadding: number;
}

interface PluginMessage {
  type: string;
  config?: ConnectionConfig;
  enabled?: boolean;
}

interface ConnectionMetadata {
  config: ConnectionConfig;
  frame1Id: string;
  frame2Id: string;
  version: string;
}

// Show the UI
figma.showUI(__html__, { width: 600, height: 520 });

let autoCreateEnabled = true;
let lastFrameCount = 0;
let autoUpdateEnabled = true;
let trackedConnections = new Map<string, ConnectionMetadata>();

// Default configuration
const defaultConfig: ConnectionConfig = {
  color: '#1976d2',
  strokeWidth: 2,
  strokeStyle: 'solid',
  sloppiness: 'low',
  arrowType: 'straight',
  arrowheads: 'end',
  startPosition: 'auto',
  endPosition: 'auto',
  connectionOffset: 20,
  avoidOverlap: true,
  opacity: 100,
  label: 'Label Text',
  labelPosition: 'center',
  labelOffset: 10,
  labelBg: '#ffffff',
  labelTextColor: '#333333',
  labelBorderColor: '#e0e0e0',
  labelBorderWidth: 1,
  labelBorderRadius: 4,
  labelPadding: 6
};

// Check if a node is a flow connection
function isFlowConnection(node: SceneNode): boolean {
  return node.type === 'GROUP' && node.name.startsWith('Flow Connection:');
}

// Get connection metadata from a group
function getConnectionMetadata(group: GroupNode): ConnectionMetadata | null {
  try {
    const metadataString = group.getPluginData('flow-connector-config');
    if (metadataString) {
      return JSON.parse(metadataString) as ConnectionMetadata;
    }
  } catch (error) {
    console.error('Failed to parse connection metadata:', error);
  }
  return null;
}

// Set connection metadata on a group
function setConnectionMetadata(group: GroupNode, metadata: ConnectionMetadata) {
  group.setPluginData('flow-connector-config', JSON.stringify(metadata));
}

// Check initial selection and send to UI
function checkSelection() {
  const selection = figma.currentPage.selection;
  const frames = selection.filter(node => node.type === 'FRAME') as FrameNode[];
  const connections = selection.filter(isFlowConnection) as GroupNode[];

  // Check if a single connection is selected
  if (connections.length === 1 && selection.length === 1) {
    const connection = connections[0];
    const metadata = getConnectionMetadata(connection);

    if (metadata) {
      figma.ui.postMessage({
        type: 'connection-selected',
        config: metadata.config,
        connectionId: connection.id,
        connectionName: connection.name
      });
      return;
    }
  }

  figma.ui.postMessage({
    type: 'selection-changed',
    frameCount: frames.length,
    frames: frames.map(frame => ({ id: frame.id, name: frame.name })),
    connectionCount: connections.length
  });

  // Auto-create connection when exactly 2 frames are selected
  if (autoCreateEnabled && frames.length === 2 && lastFrameCount !== 2) {
    // Get current config from UI or use default
    figma.ui.postMessage({ type: 'get-config' });
  }

  lastFrameCount = frames.length;
}

// Find all connections on the current page
function findAllConnections(): GroupNode[] {
  const connections: GroupNode[] = [];

  function traverse(node: SceneNode) {
    if (isFlowConnection(node)) {
      connections.push(node as GroupNode);
    }

    if ('children' in node) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const child of figma.currentPage.children) {
    traverse(child);
  }

  return connections;
}

// Track all connections for auto-updates
function trackConnections() {
  const connections = findAllConnections();
  trackedConnections.clear();

  for (const connection of connections) {
    const metadata = getConnectionMetadata(connection);
    if (metadata) {
      trackedConnections.set(connection.id, metadata);
    }
  }
}

// Check if any tracked frames have changed and update connections
async function checkAndUpdateConnections() {
  if (!autoUpdateEnabled) return;

  const connectionsToUpdate: Array<{ connection: GroupNode, metadata: ConnectionMetadata }> = [];

  for (const [connectionId, metadata] of trackedConnections) {
    const connection = figma.currentPage.findOne(node => node.id === connectionId) as GroupNode;
    if (!connection) {
      // Connection was deleted, remove from tracking
      trackedConnections.delete(connectionId);
      continue;
    }

    const frame1 = figma.currentPage.findOne(node => node.id === metadata.frame1Id) as FrameNode;
    const frame2 = figma.currentPage.findOne(node => node.id === metadata.frame2Id) as FrameNode;

    if (!frame1 || !frame2) {
      // One of the frames was deleted, remove connection from tracking
      trackedConnections.delete(connectionId);
      continue;
    }

    // Check if connection needs updating by comparing current positions with stored positions
    const currentConnectionPoints = calculateConnectionPoints(frame1, frame2, metadata.config);
    const shouldUpdate = connectionNeedsUpdate(connection, currentConnectionPoints, metadata.config);

    if (shouldUpdate) {
      connectionsToUpdate.push({ connection, metadata });
    }
  }

  // Update connections that need updating
  for (const { connection, metadata } of connectionsToUpdate) {
    try {
      const frame1 = figma.currentPage.findOne(node => node.id === metadata.frame1Id) as FrameNode;
      const frame2 = figma.currentPage.findOne(node => node.id === metadata.frame2Id) as FrameNode;

      if (frame1 && frame2) {
        // Store current selection to restore later
        const currentSelection = figma.currentPage.selection;

        // Remove old connection
        connection.remove();

        // Create new connection
        const newConnection = await createConnection(frame1, frame2, metadata.config);

        // Update tracking with new connection ID
        trackedConnections.delete(connection.id);
        trackedConnections.set(newConnection.id, metadata);

        // Restore selection if it wasn't the connection we just updated
        const wasSelected = currentSelection.some(node => node.id === connection.id);
        if (!wasSelected) {
          figma.currentPage.selection = currentSelection;
        }
      }
    } catch (error) {
      console.error('Failed to update connection:', error);
    }
  }
}

// Check if a connection needs updating based on current frame positions
function connectionNeedsUpdate(connection: GroupNode, newConnectionPoints: any, config: ConnectionConfig): boolean {
  // Get the main line from the connection
  const line = connection.children.find(child => child.name.startsWith('Connection:')) as VectorNode;
  if (!line || !line.vectorPaths || line.vectorPaths.length === 0) {
    return true; // If we can't find the line, assume it needs updating
  }

  // Extract start and end points from the current path
  const pathData = line.vectorPaths[0].data;
  const pathMatch = pathData.match(/M\s*([\d.-]+)\s*([\d.-]+).*?(?:L|C).*?([\d.-]+)\s*([\d.-]+)(?:\s|$)/);

  if (!pathMatch) {
    return true; // If we can't parse the path, assume it needs updating
  }

  const currentStart = { x: parseFloat(pathMatch[1]), y: parseFloat(pathMatch[2]) };
  const newStart = newConnectionPoints.startPoint;

  // Check if the start point has moved significantly (more than 1 pixel)
  const threshold = 1;
  const startMoved = Math.abs(currentStart.x - newStart.x) > threshold ||
    Math.abs(currentStart.y - newStart.y) > threshold;

  return startMoved;
}

// Initialize the plugin
async function initializePlugin() {
  // Load all pages first to enable document change monitoring
  await figma.loadAllPagesAsync();

  // Listen for document changes to update connections
  figma.on('documentchange', async (event) => {
    let shouldCheckConnections = false;

    for (const change of event.documentChanges) {
      if (change.type === 'PROPERTY_CHANGE') {
        const node = change.node;
        // Check if a frame's position or size changed, but ignore our plugin-created frames
        if (node.type === 'FRAME' && 'name' in node && 'parent' in node) {
          const frameNode = node as FrameNode;

          // Skip frames that are part of our connections (label frames)
          if (frameNode.name === 'Connection Label') {
            continue;
          }

          // Skip frames that are children of our connection groups
          let parent = frameNode.parent;
          while (parent) {
            if (parent.type === 'GROUP' && parent.name.startsWith('Flow Connection:')) {
              break;
            }
            parent = parent.parent;
          }
          if (parent) {
            continue; // This frame is part of a connection, skip it
          }

          const hasPositionChange = change.properties.some(prop =>
            prop === 'x' || prop === 'y' || prop === 'width' || prop === 'height'
          );
          if (hasPositionChange) {
            shouldCheckConnections = true;
            break;
          }
        }
      }
    }

    if (shouldCheckConnections) {
      // Debounce the update check to avoid too frequent updates
      setTimeout(checkAndUpdateConnections, 100);
    }
  });

  // Listen for selection changes
  figma.on('selectionchange', checkSelection);

  // Initial setup
  checkSelection();
  trackConnections();
}

// Start the plugin
initializePlugin().catch(error => {
  console.error('Failed to initialize plugin:', error);
  // Fallback: initialize without document change monitoring
  figma.on('selectionchange', checkSelection);
  checkSelection();
  trackConnections();
});

// Helper function to check if a line intersects with a rectangle (frame)
function lineIntersectsRect(lineStart: { x: number, y: number }, lineEnd: { x: number, y: number }, rect: { x: number, y: number, width: number, height: number }): boolean {
  // Expand the rectangle slightly to add padding
  const padding = 10;
  const expandedRect = {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + (padding * 2),
    height: rect.height + (padding * 2)
  };

  // Check if line intersects with any of the four sides of the rectangle
  const rectLeft = expandedRect.x;
  const rectRight = expandedRect.x + expandedRect.width;
  const rectTop = expandedRect.y;
  const rectBottom = expandedRect.y + expandedRect.height;

  // Simple line-rectangle intersection check
  // If both points are on the same side of the rectangle, no intersection
  if ((lineStart.x < rectLeft && lineEnd.x < rectLeft) ||
    (lineStart.x > rectRight && lineEnd.x > rectRight) ||
    (lineStart.y < rectTop && lineEnd.y < rectTop) ||
    (lineStart.y > rectBottom && lineEnd.y > rectBottom)) {
    return false;
  }

  // More detailed intersection check would go here, but for simplicity
  // we'll use a bounding box approach
  const lineLeft = Math.min(lineStart.x, lineEnd.x);
  const lineRight = Math.max(lineStart.x, lineEnd.x);
  const lineTop = Math.min(lineStart.y, lineEnd.y);
  const lineBottom = Math.max(lineStart.y, lineEnd.y);

  return !(lineRight < rectLeft || lineLeft > rectRight || lineBottom < rectTop || lineTop > rectBottom);
}

// Helper function to determine the best routing path to avoid overlaps
function calculateAvoidanceRoute(frame1: FrameNode, frame2: FrameNode, startPoint: { x: number, y: number }, endPoint: { x: number, y: number }, config: ConnectionConfig) {
  if (!config.avoidOverlap) {
    return { startPoint, endPoint, waypoints: [] };
  }

  // Check if direct path intersects with either frame
  const frame1Rect = { x: frame1.x, y: frame1.y, width: frame1.width, height: frame1.height };
  const frame2Rect = { x: frame2.x, y: frame2.y, width: frame2.width, height: frame2.height };

  const directPathIntersectsFrame1 = lineIntersectsRect(startPoint, endPoint, frame1Rect);
  const directPathIntersectsFrame2 = lineIntersectsRect(startPoint, endPoint, frame2Rect);

  if (!directPathIntersectsFrame1 && !directPathIntersectsFrame2) {
    return { startPoint, endPoint, waypoints: [] };
  }

  // Determine if this is a horizontal or vertical primary connection
  const dx = Math.abs(endPoint.x - startPoint.x);
  const dy = Math.abs(endPoint.y - startPoint.y);
  const isHorizontalPrimary = dx > dy;

  let waypoints: { x: number, y: number }[] = [];

  if (isHorizontalPrimary) {
    // For horizontal connections, route above or below
    const frame1Bottom = frame1.y + frame1.height;
    const frame1Top = frame1.y;
    const frame2Bottom = frame2.y + frame2.height;
    const frame2Top = frame2.y;

    // Determine if we should go above or below
    const maxBottom = Math.max(frame1Bottom, frame2Bottom);
    const minTop = Math.min(frame1Top, frame2Top);

    // Calculate clearance needed
    const clearance = config.connectionOffset + 20;

    // Try routing above first (usually cleaner)
    const routeAboveY = minTop - clearance;

    // Try routing below
    const routeBelowY = maxBottom + clearance;

    // Choose the route that's closer to the average Y position
    const avgY = (startPoint.y + endPoint.y) / 2;
    const useAbove = Math.abs(routeAboveY - avgY) < Math.abs(routeBelowY - avgY);

    const routeY = useAbove ? routeAboveY : routeBelowY;

    waypoints = [
      { x: startPoint.x, y: routeY },
      { x: endPoint.x, y: routeY }
    ];
  } else {
    // For vertical connections, route left or right
    const frame1Right = frame1.x + frame1.width;
    const frame1Left = frame1.x;
    const frame2Right = frame2.x + frame2.width;
    const frame2Left = frame2.x;

    // Determine if we should go left or right
    const maxRight = Math.max(frame1Right, frame2Right);
    const minLeft = Math.min(frame1Left, frame2Left);

    // Calculate clearance needed
    const clearance = config.connectionOffset + 20;

    // Try routing left first
    const routeLeftX = minLeft - clearance;

    // Try routing right
    const routeRightX = maxRight + clearance;

    // Choose the route that's closer to the average X position
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

function calculateConnectionPoints(frame1: FrameNode, frame2: FrameNode, config: ConnectionConfig) {
  const frame1Center = {
    x: frame1.x + frame1.width / 2,
    y: frame1.y + frame1.height / 2
  };

  const frame2Center = {
    x: frame2.x + frame2.width / 2,
    y: frame2.y + frame2.height / 2
  };

  let startPoint, endPoint, startOffsetPoint, endOffsetPoint;

  // Calculate start point based on config or auto-detect
  if (config.startPosition === 'auto') {
    // Auto-detect based on relative positions (original logic)
    const dx = frame2Center.x - frame1Center.x;
    const dy = frame2Center.y - frame1Center.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection
      if (dx > 0) {
        startPoint = { x: frame1.x + frame1.width, y: frame1Center.y }; // right
        startOffsetPoint = { x: startPoint.x + config.connectionOffset, y: startPoint.y };
      } else {
        startPoint = { x: frame1.x, y: frame1Center.y }; // left
        startOffsetPoint = { x: startPoint.x - config.connectionOffset, y: startPoint.y };
      }
    } else {
      // Vertical connection
      if (dy > 0) {
        startPoint = { x: frame1Center.x, y: frame1.y + frame1.height }; // bottom
        startOffsetPoint = { x: startPoint.x, y: startPoint.y + config.connectionOffset };
      } else {
        startPoint = { x: frame1Center.x, y: frame1.y }; // top
        startOffsetPoint = { x: startPoint.x, y: startPoint.y - config.connectionOffset };
      }
    }
  } else {
    // Use specified position
    switch (config.startPosition) {
      case 'top':
        startPoint = { x: frame1Center.x, y: frame1.y };
        startOffsetPoint = { x: startPoint.x, y: startPoint.y - config.connectionOffset };
        break;
      case 'right':
        startPoint = { x: frame1.x + frame1.width, y: frame1Center.y };
        startOffsetPoint = { x: startPoint.x + config.connectionOffset, y: startPoint.y };
        break;
      case 'bottom':
        startPoint = { x: frame1Center.x, y: frame1.y + frame1.height };
        startOffsetPoint = { x: startPoint.x, y: startPoint.y + config.connectionOffset };
        break;
      case 'left':
        startPoint = { x: frame1.x, y: frame1Center.y };
        startOffsetPoint = { x: startPoint.x - config.connectionOffset, y: startPoint.y };
        break;
    }
  }

  // Calculate end point based on config or auto-detect
  if (config.endPosition === 'auto') {
    // Auto-detect based on relative positions (original logic)
    const dx = frame2Center.x - frame1Center.x;
    const dy = frame2Center.y - frame1Center.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection
      if (dx > 0) {
        endPoint = { x: frame2.x, y: frame2Center.y }; // left
        endOffsetPoint = { x: endPoint.x - config.connectionOffset, y: endPoint.y };
      } else {
        endPoint = { x: frame2.x + frame2.width, y: frame2Center.y }; // right
        endOffsetPoint = { x: endPoint.x + config.connectionOffset, y: endPoint.y };
      }
    } else {
      // Vertical connection
      if (dy > 0) {
        endPoint = { x: frame2Center.x, y: frame2.y }; // top
        endOffsetPoint = { x: endPoint.x, y: endPoint.y - config.connectionOffset };
      } else {
        endPoint = { x: frame2Center.x, y: frame2.y + frame2.height }; // bottom
        endOffsetPoint = { x: endPoint.x, y: endPoint.y + config.connectionOffset };
      }
    }
  } else {
    // Use specified position
    switch (config.endPosition) {
      case 'top':
        endPoint = { x: frame2Center.x, y: frame2.y };
        endOffsetPoint = { x: endPoint.x, y: endPoint.y - config.connectionOffset };
        break;
      case 'right':
        endPoint = { x: frame2.x + frame2.width, y: frame2Center.y };
        endOffsetPoint = { x: endPoint.x + config.connectionOffset, y: endPoint.y };
        break;
      case 'bottom':
        endPoint = { x: frame2Center.x, y: frame2.y + frame2.height };
        endOffsetPoint = { x: endPoint.x, y: endPoint.y + config.connectionOffset };
        break;
      case 'left':
        endPoint = { x: frame2.x, y: frame2Center.y };
        endOffsetPoint = { x: endPoint.x - config.connectionOffset, y: endPoint.y };
        break;
    }
  }

  // Calculate avoidance routing if enabled
  const avoidanceRoute = calculateAvoidanceRoute(frame1, frame2, startOffsetPoint, endOffsetPoint, config);

  return {
    startPoint,
    endPoint,
    startOffsetPoint,
    endOffsetPoint,
    waypoints: avoidanceRoute.waypoints
  };
}

function createArrowHead(endPoint: { x: number, y: number }, angle: number, config: ConnectionConfig) {
  if (config.arrowheads === 'none') return null;

  const arrowLength = 12;
  const arrowAngle = Math.PI / 6; // 30 degrees

  const arrowPoint1 = {
    x: endPoint.x - arrowLength * Math.cos(angle - arrowAngle),
    y: endPoint.y - arrowLength * Math.sin(angle - arrowAngle)
  };

  const arrowPoint2 = {
    x: endPoint.x - arrowLength * Math.cos(angle + arrowAngle),
    y: endPoint.y - arrowLength * Math.sin(angle + arrowAngle)
  };

  const arrowHead = figma.createVector();

  arrowHead.vectorPaths = [{
    windingRule: 'NONZERO',
    data: `M ${arrowPoint1.x} ${arrowPoint1.y} L ${endPoint.x} ${endPoint.y} L ${arrowPoint2.x} ${arrowPoint2.y}`
  }];

  const color = hexToRgb(config.color);
  arrowHead.strokes = [{ type: 'SOLID', color, opacity: config.opacity / 100 }];
  arrowHead.strokeWeight = config.strokeWidth;

  return arrowHead;
}

function createStartArrowHead(startPoint: { x: number, y: number }, angle: number, config: ConnectionConfig) {
  if (config.arrowheads !== 'both') return null;

  const arrowLength = 12;
  const arrowAngle = Math.PI / 6; // 30 degrees
  const reverseAngle = angle + Math.PI; // Point in opposite direction

  const arrowPoint1 = {
    x: startPoint.x - arrowLength * Math.cos(reverseAngle - arrowAngle),
    y: startPoint.y - arrowLength * Math.sin(reverseAngle - arrowAngle)
  };

  const arrowPoint2 = {
    x: startPoint.x - arrowLength * Math.cos(reverseAngle + arrowAngle),
    y: startPoint.y - arrowLength * Math.sin(reverseAngle + arrowAngle)
  };

  const arrowHead = figma.createVector();

  arrowHead.vectorPaths = [{
    windingRule: 'NONZERO',
    data: `M ${arrowPoint1.x} ${arrowPoint1.y} L ${startPoint.x} ${startPoint.y} L ${arrowPoint2.x} ${arrowPoint2.y}`
  }];

  const color = hexToRgb(config.color);
  arrowHead.strokes = [{ type: 'SOLID', color, opacity: config.opacity / 100 }];
  arrowHead.strokeWeight = config.strokeWidth;

  return arrowHead;
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

function createCurvedPath(startPoint: { x: number, y: number }, endPoint: { x: number, y: number }, startOffsetPoint: { x: number, y: number }, endOffsetPoint: { x: number, y: number }, waypoints: { x: number, y: number }[], config: ConnectionConfig): string {
  // If we have waypoints (avoidance routing), create a path through them
  if (waypoints.length > 0) {
    let pathData = `M ${startPoint.x} ${startPoint.y}`;

    // Add offset point if we have one
    if (config.connectionOffset > 0) {
      pathData += ` L ${startOffsetPoint.x} ${startOffsetPoint.y}`;
    }

    // Add all waypoints
    for (const waypoint of waypoints) {
      pathData += ` L ${waypoint.x} ${waypoint.y}`;
    }

    // Add end offset point if we have one
    if (config.connectionOffset > 0) {
      pathData += ` L ${endOffsetPoint.x} ${endOffsetPoint.y}`;
    }

    // End at the final point
    pathData += ` L ${endPoint.x} ${endPoint.y}`;

    return pathData;
  }

  // Original logic for direct connections without waypoints
  if (config.arrowType === 'straight') {
    // For straight connections with offset, create an elbow path
    if (config.connectionOffset > 0) {
      return `M ${startPoint.x} ${startPoint.y} L ${startOffsetPoint.x} ${startOffsetPoint.y} L ${endOffsetPoint.x} ${endOffsetPoint.y} L ${endPoint.x} ${endPoint.y}`;
    }
    return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
  }

  if (config.arrowType === 'elbow') {
    // Create elbow path with offset points
    if (config.connectionOffset > 0) {
      const midX = (startOffsetPoint.x + endOffsetPoint.x) / 2;
      const midY = (startOffsetPoint.y + endOffsetPoint.y) / 2;
      return `M ${startPoint.x} ${startPoint.y} L ${startOffsetPoint.x} ${startOffsetPoint.y} L ${midX} ${startOffsetPoint.y} L ${midX} ${endOffsetPoint.y} L ${endOffsetPoint.x} ${endOffsetPoint.y} L ${endPoint.x} ${endPoint.y}`;
    } else {
      const midX = (startPoint.x + endPoint.x) / 2;
      return `M ${startPoint.x} ${startPoint.y} L ${midX} ${startPoint.y} L ${midX} ${endPoint.y} L ${endPoint.x} ${endPoint.y}`;
    }
  }

  // Curved path with offset
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
    // Original curved path without offset
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

function addSloppiness(path: string, config: ConnectionConfig): string {
  if (config.sloppiness === 'none') return path;

  // Add slight randomness to make it look hand-drawn
  const slopAmount = config.sloppiness === 'low' ? 2 : 5;

  return path.replace(/(\d+\.?\d*)/g, (match) => {
    const num = parseFloat(match);
    const variation = (Math.random() - 0.5) * slopAmount;
    return (num + variation).toFixed(1);
  });
}

async function updateConnection(connectionId: string, newConfig: ConnectionConfig) {
  const connection = figma.currentPage.findOne(node => node.id === connectionId) as GroupNode;
  if (!connection || !isFlowConnection(connection)) {
    throw new Error('Connection not found or invalid');
  }

  const metadata = getConnectionMetadata(connection);
  if (!metadata) {
    throw new Error('Connection metadata not found');
  }

  // Find the original frames
  const frame1 = figma.currentPage.findOne(node => node.id === metadata.frame1Id) as FrameNode;
  const frame2 = figma.currentPage.findOne(node => node.id === metadata.frame2Id) as FrameNode;

  if (!frame1 || !frame2) {
    throw new Error('Original frames not found');
  }

  // Remove the old connection from tracking
  trackedConnections.delete(connectionId);

  // Remove the old connection
  connection.remove();

  // Create new connection with updated config
  const newConnection = await createConnection(frame1, frame2, newConfig);

  return newConnection;
}

// Helper function to calculate the center point of the actual path
function calculateLabelPosition(startPoint: { x: number, y: number }, endPoint: { x: number, y: number }, startOffsetPoint: { x: number, y: number }, endOffsetPoint: { x: number, y: number }, waypoints: { x: number, y: number }[], config: ConnectionConfig): { x: number, y: number } {
  // Validate input points and provide fallbacks
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

  // Build the actual path points in order
  const pathPoints: { x: number, y: number }[] = [safeStartPoint];

  // Add offset point if we have one
  if (config.connectionOffset > 0) {
    pathPoints.push(safeStartOffsetPoint);
  }

  // Add all waypoints (with validation)
  if (waypoints && waypoints.length > 0) {
    for (const waypoint of waypoints) {
      if (!isNaN(waypoint.x) && !isNaN(waypoint.y)) {
        pathPoints.push(waypoint);
      }
    }
  }

  // Add end offset point if we have one
  if (config.connectionOffset > 0) {
    pathPoints.push(safeEndOffsetPoint);
  }

  // Add end point
  pathPoints.push(safeEndPoint);

  // Calculate the total path length and find the center point
  let totalLength = 0;
  const segments: { start: { x: number, y: number }, end: { x: number, y: number }, length: number }[] = [];

  for (let i = 0; i < pathPoints.length - 1; i++) {
    const start = pathPoints[i];
    const end = pathPoints[i + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Skip zero-length segments
    if (length > 0) {
      segments.push({ start, end, length });
      totalLength += length;
    }
  }

  // Fallback to simple midpoint if no valid segments
  if (segments.length === 0 || totalLength === 0) {
    const fallbackCenter = {
      x: (safeStartPoint.x + safeEndPoint.x) / 2,
      y: (safeStartPoint.y + safeEndPoint.y) / 2
    };

    // Apply simple offset for non-center positions
    if (config.labelPosition === 'top') {
      return { x: fallbackCenter.x, y: fallbackCenter.y - (config.labelOffset || 10) };
    } else if (config.labelPosition === 'bottom') {
      return { x: fallbackCenter.x, y: fallbackCenter.y + (config.labelOffset || 10) };
    }

    return fallbackCenter;
  }

  // Find the point at half the total length (path center)
  const halfLength = totalLength / 2;
  let currentLength = 0;
  let pathCenter = { x: 0, y: 0 };
  let pathAngle = 0;

  for (const segment of segments) {
    if (currentLength + segment.length >= halfLength) {
      // The midpoint is within this segment
      const remainingLength = halfLength - currentLength;
      const ratio = segment.length > 0 ? remainingLength / segment.length : 0;

      pathCenter = {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio
      };

      // Calculate the angle of this segment for offset positioning
      pathAngle = Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x);
      break;
    }
    currentLength += segment.length;
  }

  // Validate pathCenter and provide fallback
  if (isNaN(pathCenter.x) || isNaN(pathCenter.y)) {
    pathCenter = {
      x: (safeStartPoint.x + safeEndPoint.x) / 2,
      y: (safeStartPoint.y + safeEndPoint.y) / 2
    };
    pathAngle = Math.atan2(safeEndPoint.y - safeStartPoint.y, safeEndPoint.x - safeStartPoint.x);
  }

  // Apply position offset based on label position setting
  if (config.labelPosition === 'center') {
    return pathCenter;
  }

  // Calculate perpendicular offset for top/bottom positioning
  const perpAngle = pathAngle + Math.PI / 2; // 90 degrees perpendicular
  const offsetDistance = config.labelOffset || 10;

  let finalPosition = pathCenter;

  if (config.labelPosition === 'top') {
    finalPosition = {
      x: pathCenter.x + Math.cos(perpAngle) * offsetDistance,
      y: pathCenter.y + Math.sin(perpAngle) * offsetDistance
    };
  } else if (config.labelPosition === 'bottom') {
    finalPosition = {
      x: pathCenter.x - Math.cos(perpAngle) * offsetDistance,
      y: pathCenter.y - Math.sin(perpAngle) * offsetDistance
    };
  }

  // Final validation
  return {
    x: isNaN(finalPosition.x) ? pathCenter.x : finalPosition.x,
    y: isNaN(finalPosition.y) ? pathCenter.y : finalPosition.y
  };
}

async function createConnection(frame1: FrameNode, frame2: FrameNode, config: ConnectionConfig) {
  const { startPoint, endPoint, startOffsetPoint, endOffsetPoint, waypoints } = calculateConnectionPoints(frame1, frame2, config);

  // Create the main line
  const line = figma.createVector();
  let pathData = createCurvedPath(startPoint, endPoint, startOffsetPoint, endOffsetPoint, waypoints, config);
  pathData = addSloppiness(pathData, config);

  line.vectorPaths = [{
    windingRule: 'NONZERO',
    data: pathData
  }];

  const color = hexToRgb(config.color);
  const strokeStyle = config.strokeStyle === 'dashed' ? [5, 5] :
    config.strokeStyle === 'dotted' ? [2, 3] : [];

  line.strokes = [{
    type: 'SOLID',
    color,
    opacity: config.opacity / 100
  }];
  line.strokeWeight = config.strokeWidth;
  if (strokeStyle.length > 0) {
    line.dashPattern = strokeStyle;
  }
  line.name = `Connection: ${frame1.name} → ${frame2.name}`;

  // Create arrow heads
  // Calculate angles based on the final segments of the path
  const endAngle = config.connectionOffset > 0 ?
    Math.atan2(endPoint.y - endOffsetPoint.y, endPoint.x - endOffsetPoint.x) :
    Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
  const startAngle = config.connectionOffset > 0 ?
    Math.atan2(startOffsetPoint.y - startPoint.y, startOffsetPoint.x - startPoint.x) :
    Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

  const endArrowHead = createArrowHead(endPoint, endAngle, config);
  const startArrowHead = createStartArrowHead(startPoint, startAngle, config);

  // Create label if provided
  let labelFrame: FrameNode | null = null;
  if (config.label.trim()) {
    try {
      // Load font first - try Inter, fallback to system fonts
      try {
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      } catch {
        // Fallback to system font if Inter is not available
        await figma.loadFontAsync({ family: "Helvetica", style: "Regular" });
      }

      // Create text
      const label = figma.createText();
      label.characters = config.label;
      label.fontSize = 12;
      label.fills = [{ type: 'SOLID', color: hexToRgb(config.labelTextColor) }];

      // Create auto-layout frame for the label
      labelFrame = figma.createFrame();
      labelFrame.name = 'Connection Label';

      // Set up auto-layout
      labelFrame.layoutMode = 'HORIZONTAL';
      labelFrame.primaryAxisSizingMode = 'AUTO';
      labelFrame.counterAxisSizingMode = 'AUTO';
      labelFrame.paddingLeft = config.labelPadding;
      labelFrame.paddingRight = config.labelPadding;
      labelFrame.paddingTop = config.labelPadding;
      labelFrame.paddingBottom = config.labelPadding;

      // Set background and styling
      labelFrame.fills = [{ type: 'SOLID', color: hexToRgb(config.labelBg) }];

      if (config.labelBorderWidth > 0) {
        labelFrame.strokes = [{ type: 'SOLID', color: hexToRgb(config.labelBorderColor) }];
        labelFrame.strokeWeight = config.labelBorderWidth;
      }

      if (config.labelBorderRadius > 0) {
        labelFrame.cornerRadius = config.labelBorderRadius;
      }

      // Add text to the frame
      labelFrame.appendChild(label);

      // Calculate the label position based on configuration
      const labelPosition = calculateLabelPosition(startPoint, endPoint, startOffsetPoint, endOffsetPoint, waypoints, config);

      labelFrame.x = labelPosition.x - labelFrame.width / 2;
      labelFrame.y = labelPosition.y - labelFrame.height / 2;
    } catch (error) {
      console.error('Failed to create label:', error);
      // Continue without label if creation fails
    }
  }

  // Group all elements
  const elements: SceneNode[] = [line];
  if (endArrowHead) {
    endArrowHead.name = 'End Arrow Head';
    elements.push(endArrowHead);
  }
  if (startArrowHead) {
    startArrowHead.name = 'Start Arrow Head';
    elements.push(startArrowHead);
  }
  if (labelFrame) elements.push(labelFrame);

  const group = figma.group(elements, figma.currentPage);
  group.name = `Flow Connection: ${frame1.name} → ${frame2.name}`;

  // Store connection metadata
  const metadata: ConnectionMetadata = {
    config,
    frame1Id: frame1.id,
    frame2Id: frame2.id,
    version: '1.0'
  };
  setConnectionMetadata(group, metadata);

  // Add to tracking
  trackedConnections.set(group.id, metadata);

  figma.currentPage.appendChild(group);
  figma.currentPage.selection = [group];
  figma.viewport.scrollAndZoomIntoView([group]);

  return group;
}

figma.ui.onmessage = async (msg: any) => {
  if (msg.type === 'create-connection') {
    const selection = figma.currentPage.selection;
    const frames = selection.filter(node => node.type === 'FRAME') as FrameNode[];

    if (frames.length !== 2) {
      figma.ui.postMessage({
        type: 'error',
        message: 'Please select exactly 2 frames to connect'
      });
      return;
    }

    if (msg.config) {
      try {
        await createConnection(frames[0], frames[1], msg.config);
        figma.ui.postMessage({
          type: 'success',
          message: 'Connection created successfully!'
        });
      } catch (error) {
        figma.ui.postMessage({
          type: 'error',
          message: 'Failed to create connection: ' + (error as Error).message
        });
      }
    }
  }

  if (msg.type === 'update-connection') {
    if (msg.connectionId && msg.config) {
      try {
        await updateConnection(msg.connectionId, msg.config);
        figma.ui.postMessage({
          type: 'success',
          message: 'Connection updated successfully!'
        });
      } catch (error) {
        figma.ui.postMessage({
          type: 'error',
          message: 'Failed to update connection: ' + (error as Error).message
        });
      }
    }
  }

  if (msg.type === 'auto-create-connection') {
    const selection = figma.currentPage.selection;
    const frames = selection.filter(node => node.type === 'FRAME') as FrameNode[];

    if (frames.length === 2 && msg.config) {
      try {
        await createConnection(frames[0], frames[1], msg.config);
        figma.ui.postMessage({
          type: 'success',
          message: 'Auto-connection created!'
        });
      } catch (error) {
        figma.ui.postMessage({
          type: 'error',
          message: 'Failed to auto-create connection: ' + (error as Error).message
        });
      }
    }
  }

  if (msg.type === 'toggle-auto-create') {
    autoCreateEnabled = msg.enabled ?? true;
  }

  if (msg.type === 'toggle-auto-update') {
    autoUpdateEnabled = msg.enabled ?? true;
    if (autoUpdateEnabled) {
      trackConnections(); // Re-track connections when enabled
    }
  }

  if (msg.type === 'save-config') {
    try {
      await figma.clientStorage.setAsync('flow-connector-config', JSON.stringify(msg.config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  if (msg.type === 'load-config') {
    try {
      const savedConfig = await figma.clientStorage.getAsync('flow-connector-config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        figma.ui.postMessage({
          type: 'config-loaded',
          config: config
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
