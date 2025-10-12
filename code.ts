// Flow Connector Plugin - Creates configurable arrows between selected frames

interface ConnectionConfig {
  color: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  sloppiness: 'none' | 'low' | 'high';
  arrowType: 'straight' | 'curved' | 'elbow';
  arrowheads: 'none' | 'end' | 'both';
  opacity: number;
  label: string;
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
  opacity: 100,
  label: 'Label Text',
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
    const currentConnectionPoints = calculateConnectionPoints(frame1, frame2);
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
        // Check if a frame's position or size changed
        if (node.type === 'FRAME') {
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

function calculateConnectionPoints(frame1: FrameNode, frame2: FrameNode) {
  const frame1Center = {
    x: frame1.x + frame1.width / 2,
    y: frame1.y + frame1.height / 2
  };

  const frame2Center = {
    x: frame2.x + frame2.width / 2,
    y: frame2.y + frame2.height / 2
  };

  // Calculate which edges to connect based on relative positions
  const dx = frame2Center.x - frame1Center.x;
  const dy = frame2Center.y - frame1Center.y;

  let startPoint, endPoint;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection
    if (dx > 0) {
      // Frame2 is to the right of frame1
      startPoint = { x: frame1.x + frame1.width, y: frame1Center.y };
      endPoint = { x: frame2.x, y: frame2Center.y };
    } else {
      // Frame2 is to the left of frame1
      startPoint = { x: frame1.x, y: frame1Center.y };
      endPoint = { x: frame2.x + frame2.width, y: frame2Center.y };
    }
  } else {
    // Vertical connection
    if (dy > 0) {
      // Frame2 is below frame1
      startPoint = { x: frame1Center.x, y: frame1.y + frame1.height };
      endPoint = { x: frame2Center.x, y: frame2.y };
    } else {
      // Frame2 is above frame1
      startPoint = { x: frame1Center.x, y: frame1.y };
      endPoint = { x: frame2Center.x, y: frame2.y + frame2.height };
    }
  }

  return { startPoint, endPoint };
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

function createCurvedPath(startPoint: { x: number, y: number }, endPoint: { x: number, y: number }, config: ConnectionConfig): string {
  if (config.arrowType === 'straight') {
    return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
  }

  if (config.arrowType === 'elbow') {
    const midX = (startPoint.x + endPoint.x) / 2;
    return `M ${startPoint.x} ${startPoint.y} L ${midX} ${startPoint.y} L ${midX} ${endPoint.y} L ${endPoint.x} ${endPoint.y}`;
  }

  // Curved path
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

async function createConnection(frame1: FrameNode, frame2: FrameNode, config: ConnectionConfig) {
  const { startPoint, endPoint } = calculateConnectionPoints(frame1, frame2);

  // Create the main line
  const line = figma.createVector();
  let pathData = createCurvedPath(startPoint, endPoint, config);
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
  const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
  const endArrowHead = createArrowHead(endPoint, angle, config);
  const startArrowHead = createStartArrowHead(startPoint, angle, config);

  // Create label if provided
  let labelGroup: GroupNode | null = null;
  if (config.label.trim()) {
    // Load font first
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });

    // Create text
    const label = figma.createText();
    label.characters = config.label;
    label.fontSize = 12;
    label.fills = [{ type: 'SOLID', color: hexToRgb(config.labelTextColor), opacity: config.opacity / 100 }];

    // Create background rectangle
    const bg = figma.createRectangle();
    bg.resize(label.width + (config.labelPadding * 2), label.height + (config.labelPadding * 2));
    bg.fills = [{ type: 'SOLID', color: hexToRgb(config.labelBg), opacity: config.opacity / 100 }];
    bg.strokes = [{ type: 'SOLID', color: hexToRgb(config.labelBorderColor), opacity: config.opacity / 100 }];
    bg.strokeWeight = config.labelBorderWidth;
    bg.cornerRadius = config.labelBorderRadius;

    // Position text on top of background
    label.x = config.labelPadding;
    label.y = config.labelPadding;

    // Group background and text
    labelGroup = figma.group([bg, label], figma.currentPage);
    labelGroup.name = 'Connection Label';

    // Position label group at the middle of the line
    const midPoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2
    };

    labelGroup.x = midPoint.x - labelGroup.width / 2;
    labelGroup.y = midPoint.y - labelGroup.height / 2;
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
  if (labelGroup) elements.push(labelGroup);

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

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
