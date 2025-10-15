import React, { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Edge,
  EdgeTypes,
  Node,
  NodeTypes,
  Position,
  ReactFlowProvider,
  useReactFlow,
  useStoreApi,
} from "reactflow";
import "reactflow/dist/style.css";
import { ConnectionConfig } from "../../types";
import PreviewFrameNode from "../nodes/PreviewFrameNode";
import ConnectionPreviewEdge, {
  PreviewEdgeData,
} from "../edges/ConnectionPreviewEdge";

interface InteractiveConnectionPointsProps {
  startPosition: "auto" | "top" | "right" | "bottom" | "left";
  endPosition: "auto" | "top" | "right" | "bottom" | "left";
  onStartPositionChange: (
    value: "auto" | "top" | "right" | "bottom" | "left"
  ) => void;
  onEndPositionChange: (
    value: "auto" | "top" | "right" | "bottom" | "left"
  ) => void;
  label: string;
}

// Increased frame dimensions for better visibility
const LARGE_SOURCE_FRAME = { x: 20, y: 30, width: 80, height: 60 };
const LARGE_TARGET_FRAME = { x: 140, y: 90, width: 80, height: 60 };
const INTERACTIVE_CANVAS = { width: 240, height: 180 };

const FlowViewportControls: React.FC = () => {
  const reactFlow = useReactFlow();
  const store = useStoreApi();

  const resetView = useCallback(() => {
    reactFlow.fitView({ padding: 0.2, duration: 200 });
  }, [reactFlow]);

  return (
    <div className="pointer-events-auto">
      <button
        onClick={resetView}
        className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        aria-label="Reset view"
      >
        Reset
      </button>
    </div>
  );
};

const InteractiveConnectionPointsInner: React.FC<
  InteractiveConnectionPointsProps
> = ({
  startPosition,
  endPosition,
  onStartPositionChange,
  onEndPositionChange,
  label,
}) => {
  const reactFlow = useReactFlow();

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
      onStartPositionChange(position);
    },
    [onStartPositionChange]
  );

  const handleEndPositionClick = useCallback(
    (position: "top" | "right" | "bottom" | "left" | "auto") => {
      onEndPositionChange(position);
    },
    [onEndPositionChange]
  );

  // Create a minimal config for preview
  const previewConfig: ConnectionConfig = useMemo(
    () => ({
      color: "#3b82f6",
      opacity: 100,
      strokeWidth: 2,
      strokeStyle: "solid",
      strokeCap: "round",
      strokeJoin: "round",
      sloppiness: "none",
      arrowType: "curved",
      arrowheads: "end",
      startPosition,
      endPosition,
      connectionOffset: 8,
      avoidOverlap: false,
      label: "",
      labelFontSize: 12,
      labelTextColor: "#374151",
      labelBg: "rgba(255,255,255,0.9)",
      labelBorderColor: "rgba(209,213,219,0.8)",
      labelBorderWidth: 1,
      labelBorderRadius: 4,
      labelPadding: 4,
      labelPosition: "center",
      labelOffset: 10,
    }),
    [startPosition, endPosition]
  );

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

  const nodes: Node[] = useMemo(() => {
    return [
      {
        id: "source",
        type: "frame",
        position: { x: LARGE_SOURCE_FRAME.x, y: LARGE_SOURCE_FRAME.y },
        data: {
          width: LARGE_SOURCE_FRAME.width,
          height: LARGE_SOURCE_FRAME.height,
          label: "Start",
          muted: false,
          isSource: true,
          activePosition: startPosition,
          onPositionClick: handleStartPositionClick,
          handlePosition: mapPositionToEnum(startPosition),
        },
        draggable: false,
        selectable: false,
        focusable: false,
        connectable: false,
      },
      {
        id: "target",
        type: "frame",
        position: { x: LARGE_TARGET_FRAME.x, y: LARGE_TARGET_FRAME.y },
        data: {
          width: LARGE_TARGET_FRAME.width,
          height: LARGE_TARGET_FRAME.height,
          label: "End",
          muted: false,
          isSource: false,
          activePosition: endPosition,
          onPositionClick: handleEndPositionClick,
          handlePosition: mapPositionToEnum(endPosition),
        },
        draggable: false,
        selectable: false,
        focusable: false,
        connectable: false,
      },
    ];
  }, [
    startPosition,
    endPosition,
    handleStartPositionClick,
    handleEndPositionClick,
    mapPositionToEnum,
  ]);

  const edges: Edge<PreviewEdgeData>[] = useMemo(() => {
    // Create a simple straight line between the frames
    const sourceCenter = {
      x: LARGE_SOURCE_FRAME.x + LARGE_SOURCE_FRAME.width / 2,
      y: LARGE_SOURCE_FRAME.y + LARGE_SOURCE_FRAME.height / 2,
    };
    const targetCenter = {
      x: LARGE_TARGET_FRAME.x + LARGE_TARGET_FRAME.width / 2,
      y: LARGE_TARGET_FRAME.y + LARGE_TARGET_FRAME.height / 2,
    };

    return [
      {
        id: "preview-edge",
        source: "source",
        sourceHandle: "frame-source",
        target: "target",
        targetHandle: "frame-target",
        type: "preview",
        sourcePosition: mapPositionToEnum(startPosition),
        targetPosition: mapPositionToEnum(endPosition),
        data: {
          path: `M ${sourceCenter.x} ${sourceCenter.y} L ${targetCenter.x} ${targetCenter.y}`,
          stroke: "#3b82f6",
          strokeWidth: 2,
          opacity: 0.8,
          strokeDasharray: undefined,
          arrowheads: ["end"],
          pathType: "straight",
          borderRadius: undefined,
          label: null,
          tooltip: "Connection preview",
          onEdgeClick: () => {},
          onLabelClick: () => {},
          showMarkers: true,
          startPosition,
          endPosition,
        },
        selectable: false,
        focusable: false,
        animated: false,
        interactionWidth: 18,
      },
    ];
  }, [startPosition, endPosition, mapPositionToEnum]);

  useEffect(() => {
    const { zoom } = reactFlow.getViewport();
    reactFlow.fitView({ padding: 0.2, duration: 0 });
    const frameId = requestAnimationFrame(() => {
      const { x, y } = reactFlow.getViewport();
      reactFlow.setViewport({ x, y, zoom: zoom || 1 }, { duration: 0 });
    });
    return () => cancelAnimationFrame(frameId);
  }, [reactFlow]);

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-semibold text-gray-700">
        {label}
      </label>

      {/* Interactive Flow Preview */}
      <div className="relative h-48 w-full bg-gray-50 rounded-lg border overflow-hidden">
        <div className="pointer-events-none absolute left-2 bottom-2 z-20">
          <FlowViewportControls />
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypeMap}
          edgeTypes={edgeTypeMap}
          fitView
          minZoom={0.5}
          maxZoom={2}
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
        >
          <Background
            id="connection-dots"
            gap={16}
            size={0.8}
            color="#e5e7eb"
          />
        </ReactFlow>
      </div>

      {/* Instructions */}
      <p className="text-xs text-gray-500 text-center">
        Click on the edges of the frames to change connection points
      </p>
    </div>
  );
};

const InteractiveConnectionPoints: React.FC<
  InteractiveConnectionPointsProps
> = (props) => {
  return (
    <ReactFlowProvider>
      <InteractiveConnectionPointsInner {...props} />
    </ReactFlowProvider>
  );
};

export default InteractiveConnectionPoints;
