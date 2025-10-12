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
}

interface PluginMessage {
  type: string;
  config?: ConnectionConfig;
  enabled?: boolean;
}

// Show the UI
figma.showUI(__html__, { width: 320, height: 600 });

let autoCreateEnabled = true;
let lastFrameCount = 0;

// Default configuration
const defaultConfig: ConnectionConfig = {
  color: '#1976d2',
  strokeWidth: 2,
  strokeStyle: 'solid',
  sloppiness: 'low',
  arrowType: 'straight',
  arrowheads: 'end',
  opacity: 100,
  label: ''
};

// Check initial selection and send to UI
function checkSelection() {
  const selection = figma.currentPage.selection;
  const frames = selection.filter(node => node.type === 'FRAME') as FrameNode[];
  
  figma.ui.postMessage({
    type: 'selection-changed',
    frameCount: frames.length,
    frames: frames.map(frame => ({ id: frame.id, name: frame.name }))
  });

  // Auto-create connection when exactly 2 frames are selected
  if (autoCreateEnabled && frames.length === 2 && lastFrameCount !== 2) {
    // Get current config from UI or use default
    figma.ui.postMessage({ type: 'get-config' });
  }
  
  lastFrameCount = frames.length;
}

// Listen for selection changes
figma.on('selectionchange', checkSelection);

// Initial check
checkSelection();

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

function createArrowHead(endPoint: {x: number, y: number}, angle: number, config: ConnectionConfig) {
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

function createStartArrowHead(startPoint: {x: number, y: number}, angle: number, config: ConnectionConfig) {
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

function createCurvedPath(startPoint: {x: number, y: number}, endPoint: {x: number, y: number}, config: ConnectionConfig): string {
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
  let label: TextNode | null = null;
  if (config.label.trim()) {
    // Load font first
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    
    label = figma.createText();
    label.characters = config.label;
    label.fontSize = 12;
    label.fills = [{ type: 'SOLID', color, opacity: config.opacity / 100 }];
    
    // Position label at the middle of the line
    const midPoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2
    };
    
    label.x = midPoint.x - label.width / 2;
    label.y = midPoint.y - label.height / 2;
    label.name = 'Connection Label';
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
  if (label) elements.push(label);
  
  const group = figma.group(elements, figma.currentPage);
  group.name = `Flow Connection: ${frame1.name} → ${frame2.name}`;
  
  figma.currentPage.appendChild(group);
  figma.currentPage.selection = [group];
  figma.viewport.scrollAndZoomIntoView([group]);
  
  return group;
}

figma.ui.onmessage = async (msg: PluginMessage) => {
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
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
