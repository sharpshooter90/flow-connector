import React, { useState } from "react";
import { Handle, NodeProps, Position } from "reactflow";

type EdgePosition = "top" | "right" | "bottom" | "left" | "auto";

interface PreviewFrameNodeData {
  width: number;
  height: number;
  label: string;
  muted?: boolean;
  isSource?: boolean;
  activePosition?: EdgePosition;
  onPositionClick?: (position: EdgePosition) => void;
}

interface EdgeIndicatorProps {
  position: EdgePosition;
  isActive: boolean;
  isHovered: boolean;
  isFrameHovered: boolean;
  width: number;
  height: number;
  onHover: (hovered: boolean) => void;
  onClick: (e: React.MouseEvent) => void;
}

const EdgeIndicator: React.FC<EdgeIndicatorProps> = ({
  position,
  isActive,
  isHovered,
  isFrameHovered,
  width,
  height,
  onHover,
  onClick,
}) => {
  const edgeThickness = 12;
  const cornerRadius = 6;

  // Determine the edge styling based on state
  const getEdgeStyle = () => {
    if (isActive) {
      // Active (clicked) state - persistent highlight
      return {
        backgroundColor: "rgb(59, 130, 246)", // blue-500
        borderColor: "rgb(37, 99, 235)", // blue-600
        opacity: 1,
        boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)",
      };
    } else if (isHovered) {
      // Hover state - visible highlight
      return {
        backgroundColor: "rgb(96, 165, 250)", // blue-400
        borderColor: "rgb(59, 130, 246)", // blue-500
        opacity: 1,
        boxShadow: "0 0 0 2px rgba(96, 165, 250, 0.2)",
      };
    } else if (isFrameHovered) {
      // Frame hovered but edge not hovered - subtle indicator
      return {
        backgroundColor: "rgb(191, 219, 254)", // blue-200
        borderColor: "rgb(147, 197, 253)", // blue-300
        opacity: 0.3,
        boxShadow: "none",
      };
    } else {
      // Default state - hidden
      return {
        backgroundColor: "rgb(191, 219, 254)", // blue-200
        borderColor: "rgb(147, 197, 253)", // blue-300
        opacity: 0,
        boxShadow: "none",
      };
    }
  };

  // Position-specific styles
  const getPositionStyle = () => {
    switch (position) {
      case "top":
        return {
          top: -edgeThickness / 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: `${width * 0.6}px`,
          height: `${edgeThickness}px`,
        };
      case "right":
        return {
          right: -edgeThickness / 2,
          top: "50%",
          transform: "translateY(-50%)",
          width: `${edgeThickness}px`,
          height: `${height * 0.6}px`,
        };
      case "bottom":
        return {
          bottom: -edgeThickness / 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: `${width * 0.6}px`,
          height: `${edgeThickness}px`,
        };
      case "left":
        return {
          left: -edgeThickness / 2,
          top: "50%",
          transform: "translateY(-50%)",
          width: `${edgeThickness}px`,
          height: `${height * 0.6}px`,
        };
      default:
        return {};
    }
  };

  const edgeStyle = getEdgeStyle();
  const positionStyle = getPositionStyle();

  return (
    <div
      className="absolute cursor-pointer border-2 transition-all duration-200 ease-in-out"
      style={{
        ...positionStyle,
        ...edgeStyle,
        borderRadius: `${cornerRadius}px`,
        zIndex: 1000,
        pointerEvents: "auto",
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick(e);
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      role="button"
      aria-label={`Select ${position} edge`}
      tabIndex={0}
    />
  );
};

const PreviewFrameNode: React.FC<NodeProps<PreviewFrameNodeData>> = ({
  data,
}) => {
  const [hoveredEdge, setHoveredEdge] = useState<EdgePosition | null>(null);
  const [isFrameHovered, setIsFrameHovered] = useState(false);

  const handleEdgeClick = (position: EdgePosition) => {
    if (data.onPositionClick) {
      data.onPositionClick(position);
    }
  };

  const edges: EdgePosition[] = ["top", "right", "bottom", "left"];

  return (
    <div
      className="relative"
      style={{
        width: data.width,
        height: data.height,
      }}
      onMouseEnter={() => setIsFrameHovered(true)}
      onMouseLeave={() => {
        setIsFrameHovered(false);
        setHoveredEdge(null);
      }}
    >
      {/* Frame body */}
      <div
        className={`absolute inset-0 flex items-center justify-center rounded-md border-2 text-[10px] font-medium shadow-sm transition-all ${
          data.muted
            ? "border-gray-300 bg-gray-200 text-gray-400"
            : "border-blue-400 bg-blue-100 text-blue-900"
        }`}
        style={{
          opacity: data.muted ? 0.4 : 1,
        }}
      >
        {data.label}
      </div>

      {/* Edge indicators for all four sides */}
      {edges.map((edge) => (
        <EdgeIndicator
          key={edge}
          position={edge}
          isActive={data.activePosition === edge}
          isHovered={isFrameHovered && hoveredEdge === edge}
          isFrameHovered={isFrameHovered}
          width={data.width}
          height={data.height}
          onHover={(hovered) => setHoveredEdge(hovered ? edge : null)}
          onClick={() => handleEdgeClick(edge)}
        />
      ))}

      {/* ReactFlow handles (invisible) */}
      <Handle
        id="frame-source"
        type="source"
        position={Position.Right}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <Handle
        id="frame-target"
        type="target"
        position={Position.Left}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
};

export default PreviewFrameNode;
