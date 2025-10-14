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

const PreviewFrameNode: React.FC<NodeProps<PreviewFrameNodeData>> = ({
  data,
}) => {
  const [hoveredEdge, setHoveredEdge] = useState<EdgePosition | null>(null);

  const handleEdgeClick = (position: EdgePosition, e: React.MouseEvent) => {
    e.stopPropagation();
    data.onPositionClick?.(position);
  };

  const getEdgeClasses = (position: EdgePosition) => {
    const isActive = data.activePosition === position;
    const isHovered = hoveredEdge === position;

    if (isActive) {
      return "bg-blue-500 border-2 border-blue-600";
    }
    if (isHovered) {
      return "bg-blue-300 border-2 border-blue-400";
    }
    return "bg-transparent border-2 border-transparent";
  };

  const edgeSize = 8;
  const cornerRadius = 6;

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center rounded-md border-2 text-[10px] font-medium shadow-sm transition-all ${
        data.muted
          ? "border-gray-300 bg-gray-200 text-gray-400"
          : "border-blue-400 bg-blue-100 text-blue-900"
      }`}
      style={{
        width: data.width,
        height: data.height,
        opacity: data.muted ? 0.4 : 1,
      }}
    >
      {data.label}

      {/* Top Edge */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 cursor-pointer transition-all ${getEdgeClasses(
          "top"
        )}`}
        style={{
          top: -edgeSize / 2,
          width: data.width * 0.4,
          height: edgeSize,
          borderRadius: `${cornerRadius}px`,
        }}
        onMouseEnter={() => setHoveredEdge("top")}
        onMouseLeave={() => setHoveredEdge(null)}
        onClick={(e) => handleEdgeClick("top", e)}
      />

      {/* Right Edge */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 cursor-pointer transition-all ${getEdgeClasses(
          "right"
        )}`}
        style={{
          right: -edgeSize / 2,
          width: edgeSize,
          height: data.height * 0.4,
          borderRadius: `${cornerRadius}px`,
        }}
        onMouseEnter={() => setHoveredEdge("right")}
        onMouseLeave={() => setHoveredEdge(null)}
        onClick={(e) => handleEdgeClick("right", e)}
      />

      {/* Bottom Edge */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 cursor-pointer transition-all ${getEdgeClasses(
          "bottom"
        )}`}
        style={{
          bottom: -edgeSize / 2,
          width: data.width * 0.4,
          height: edgeSize,
          borderRadius: `${cornerRadius}px`,
        }}
        onMouseEnter={() => setHoveredEdge("bottom")}
        onMouseLeave={() => setHoveredEdge(null)}
        onClick={(e) => handleEdgeClick("bottom", e)}
      />

      {/* Left Edge */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 cursor-pointer transition-all ${getEdgeClasses(
          "left"
        )}`}
        style={{
          left: -edgeSize / 2,
          width: edgeSize,
          height: data.height * 0.4,
          borderRadius: `${cornerRadius}px`,
        }}
        onMouseEnter={() => setHoveredEdge("left")}
        onMouseLeave={() => setHoveredEdge(null)}
        onClick={(e) => handleEdgeClick("left", e)}
      />

      <Handle
        id="frame-source"
        type="source"
        position={Position.Right}
        style={{ opacity: 0 }}
      />
      <Handle
        id="frame-target"
        type="target"
        position={Position.Left}
        style={{ opacity: 0 }}
      />
    </div>
  );
};

export default PreviewFrameNode;
