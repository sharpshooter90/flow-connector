import React, { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Edge,
  EdgeTypes,
  MiniMap,
  Node,
  NodeTypes,
  Position,
  ReactFlowProvider,
  useReactFlow,
  useStoreApi,
} from "reactflow";
import "reactflow/dist/style.css";
import { ConnectionConfig } from "../types";
import { buildPreviewGeometry } from "../utils/previewConnection";
import PreviewFrameNode from "./nodes/PreviewFrameNode";
import ConnectionPreviewEdge, {
  PreviewEdgeData,
} from "./edges/ConnectionPreviewEdge";
import { Button } from "./ui/button";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";

const PREVIEW_SCALE = 0.3;

type SidebarTarget = "properties" | "settings";

interface PreviewFlowProps {
  config: ConnectionConfig;
  frameCount: number;
  isEditingConnection: boolean;
  updateConfig: (updates: Partial<ConnectionConfig>) => void;
  onRequestSidebar: (target: SidebarTarget) => void;
  onRequestLabelEdit: () => void;
  onRequestArrowEdit: () => void;
}

const FlowViewportControls: React.FC = () => {
  const reactFlow = useReactFlow();
  const store = useStoreApi();

  const zoomBy = useCallback(
    (delta: number) => {
      const { d3Zoom, d3Selection } = store.getState();
      if (d3Zoom && d3Selection) {
        d3Zoom.scaleBy(d3Selection.transition().duration(150), 1 + delta);
      }
    },
    [store]
  );

  const resetView = useCallback(() => {
    reactFlow.fitView({ padding: 0.3, duration: 200 });
  }, [reactFlow]);

  return (
    <div className="pointer-events-auto flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => zoomBy(-0.15)}
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => zoomBy(0.15)}
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={resetView}
        aria-label="Reset view"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

const PreviewFlowInner: React.FC<PreviewFlowProps> = ({
  config,
  frameCount,
  isEditingConnection,
  updateConfig,
  onRequestSidebar,
  onRequestLabelEdit,
  onRequestArrowEdit,
}) => {
  const reactFlow = useReactFlow();
  const geometry = useMemo(() => buildPreviewGeometry(config), [config]);
  const previewData = useMemo(() => {
    const labelText = config.label?.trim() || "";
    const labelStyle = labelText
      ? {
          text: labelText,
          fontSize: Math.max(config.labelFontSize || 12, 8),
          textColor: config.labelTextColor || "#374151",
          background: config.labelBg || "rgba(255,255,255,0.9)",
          borderColor: config.labelBorderColor || "rgba(209,213,219,0.8)",
          borderWidth: Math.max(config.labelBorderWidth ?? 0, 0),
          borderRadius: Math.max(config.labelBorderRadius ?? 0, 0),
          padding: Math.max(config.labelPadding ?? 0, 0),
          position: config.labelPosition ?? "center",
          offset: config.labelOffset ?? 10,
        }
      : null;

    const pathType: "bezier" | "smoothstep" | "straight" =
      config.arrowType === "elbow"
        ? "smoothstep"
        : config.arrowType === "straight"
        ? "straight"
        : "bezier";

    const arrowheads: Array<"start" | "end"> =
      config.arrowheads === "both"
        ? ["start", "end"]
        : config.arrowheads === "end"
        ? ["end"]
        : [];

    const borderRadius =
      pathType === "smoothstep"
        ? Math.max(config.connectionOffset ?? 0, 12)
        : undefined;

    return {
      frames: geometry.frames,
      path: geometry.path,
      strokeWidth: Math.max(geometry.strokeWidth, 1),
      strokeDasharray: geometry.strokeDasharray,
      tooltip: labelText || "Connection preview",
      label: labelStyle,
      arrowheads,
      pathType,
      borderRadius,
    };
  }, [config, geometry]);
  const nodeTypeMap = useMemo<NodeTypes>(
    () => ({
      frame: PreviewFrameNode,
    }),
    []
  );
  const edgeTypeMap = useMemo<EdgeTypes>(
    () => ({
      preview: ConnectionPreviewEdge,
    }),
    []
  );

  // Map string positions to ReactFlow Position enum
  const mapPositionToEnum = useCallback((position: string): Position => {
    switch (position) {
      case "top":
        return Position.Top;
      case "right":
        return Position.Right;
      case "bottom":
        return Position.Bottom;
      case "left":
        return Position.Left;
      default:
        return Position.Right; // Default for auto
    }
  }, []);

  const handleStartPositionClick = useCallback(
    (position: "top" | "right" | "bottom" | "left" | "auto") => {
      updateConfig({ startPosition: position });
    },
    [updateConfig]
  );

  const handleEndPositionClick = useCallback(
    (position: "top" | "right" | "bottom" | "left" | "auto") => {
      updateConfig({ endPosition: position });
    },
    [updateConfig]
  );

  const nodes: Node[] = useMemo(() => {
    const [source, target] = previewData.frames;
    // Mute only when not editing and frames aren't selected
    const isMuted = frameCount !== 2 && !isEditingConnection;
    return [
      {
        id: "source",
        type: "frame",
        position: { x: source.x, y: source.y },
        data: {
          width: source.width,
          height: source.height,
          label: "Frame A",
          muted: isMuted,
          isSource: true,
          activePosition: config.startPosition,
          onPositionClick: handleStartPositionClick,
        },
        draggable: false,
        selectable: false,
        focusable: false,
        connectable: false,
      },
      {
        id: "target",
        type: "frame",
        position: { x: target.x, y: target.y },
        data: {
          width: target.width,
          height: target.height,
          label: "Frame B",
          muted: isMuted,
          isSource: false,
          activePosition: config.endPosition,
          onPositionClick: handleEndPositionClick,
        },
        draggable: false,
        selectable: false,
        focusable: false,
        connectable: false,
      },
    ];
  }, [
    previewData,
    frameCount,
    isEditingConnection,
    config.startPosition,
    config.endPosition,
    handleStartPositionClick,
    handleEndPositionClick,
  ]);

  const edges: Edge<PreviewEdgeData>[] = useMemo(() => {
    // Mute only when not editing and frames aren't selected
    const isMuted = frameCount !== 2 && !isEditingConnection;

    return [
      {
        id: "preview-edge",
        source: "source",
        sourceHandle: "frame-source",
        target: "target",
        targetHandle: "frame-target",
        type: "preview",
        sourcePosition: mapPositionToEnum(config.startPosition),
        targetPosition: mapPositionToEnum(config.endPosition),
        data: {
          path: previewData.path,
          stroke: isMuted ? "#d1d5db" : geometry.color,
          strokeWidth: previewData.strokeWidth,
          opacity: isMuted ? 0.4 : geometry.opacity,
          strokeDasharray: previewData.strokeDasharray,
          arrowheads: previewData.arrowheads,
          pathType: previewData.pathType,
          borderRadius: previewData.borderRadius,
          label:
            isMuted && previewData.label
              ? {
                  ...previewData.label,
                  textColor: "#9ca3af",
                  background: "rgba(243, 244, 246, 0.9)",
                  borderColor: "rgba(209, 213, 219, 0.8)",
                }
              : previewData.label,
          tooltip: previewData.tooltip,
          onEdgeClick: onRequestArrowEdit,
          onLabelClick: onRequestLabelEdit,
          showMarkers: true,
          startPosition: config.startPosition,
          endPosition: config.endPosition,
        },
        selectable: false,
        focusable: false,
        animated: isMuted,
        interactionWidth: Math.max(previewData.strokeWidth, 1) + 16,
      },
    ];
  }, [
    geometry,
    onRequestArrowEdit,
    onRequestLabelEdit,
    previewData,
    frameCount,
    isEditingConnection,
    config.startPosition,
    config.endPosition,
    mapPositionToEnum,
  ]);

  useEffect(() => {
    const { zoom } = reactFlow.getViewport();
    reactFlow.fitView({ padding: 0.4, duration: 0 });
    const frameId = requestAnimationFrame(() => {
      const { x, y } = reactFlow.getViewport();
      reactFlow.setViewport(
        { x, y, zoom: zoom || PREVIEW_SCALE },
        { duration: 0 }
      );
    });
    return () => cancelAnimationFrame(frameId);
  }, [reactFlow, previewData]);

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute left-6 bottom-4 z-20">
        <FlowViewportControls />
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypeMap}
        edgeTypes={edgeTypeMap}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        panOnDrag
        panOnScroll={false}
        zoomOnScroll
        preventScrolling={false}
        className="bg-white"
        proOptions={{ hideAttribution: true }}
        onPaneClick={() => onRequestSidebar("properties")}
      >
        <Background id="preview-dots" gap={22} size={1} color="#e5e7eb" />
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          className="hidden sm:block"
          nodeColor={() => geometry.color}
          maskStrokeColor="#e5e7eb"
          maskStrokeWidth={1}
        />
      </ReactFlow>
    </div>
  );
};

const PreviewFlow: React.FC<PreviewFlowProps> = (props) => {
  return (
    <ReactFlowProvider>
      <PreviewFlowInner {...props} />
    </ReactFlowProvider>
  );
};

export default PreviewFlow;
