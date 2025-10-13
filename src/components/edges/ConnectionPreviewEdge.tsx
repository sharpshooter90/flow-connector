import React from "react";
import { EdgeLabelRenderer, EdgeProps, getBezierPath } from "reactflow";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface PreviewEdgeLabel {
  text: string;
  fontSize: number;
  textColor: string;
  background: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  position: 'center' | 'top' | 'bottom';
  offset: number;
}

export interface PreviewEdgeData {
  path?: string;
  stroke?: string;
  opacity?: number;
  strokeWidth?: number;
  strokeDasharray?: string;
  arrowPaths?: string[];
  label?: PreviewEdgeLabel | null;
  tooltip?: string;
  onEdgeClick?: () => void;
  onLabelClick?: () => void;
}

const ConnectionPreviewEdge: React.FC<EdgeProps<PreviewEdgeData>> = ({
  id,
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) => {
  const [autoPath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgePath =
    data?.path && !data.path.includes("NaN") && data.path.trim().length > 0
      ? data.path
      : autoPath;
  const stroke = data?.stroke ?? "#1d4ed8";
  const strokeWidth = data?.strokeWidth ?? 2;
  const opacity = data?.opacity ?? 1;
  const tooltipText = data?.tooltip ?? data?.label?.text ?? "";
  const arrowPaths = (data?.arrowPaths ?? []).filter(
    (arrowPath) => arrowPath && !arrowPath.includes("NaN")
  );
  let labelXAdjusted = labelX;
  let labelYAdjusted = labelY;

  if (data?.label) {
    const offset = data.label.offset ?? 0;
    if (data.label.position === "top") {
      labelYAdjusted -= offset;
    } else if (data.label.position === "bottom") {
      labelYAdjusted += offset;
    }
  }

  const handleClick = (
    event: React.MouseEvent<SVGPathElement | SVGRectElement | SVGTextElement>
  ) => {
    event.stopPropagation();
    data?.onEdgeClick?.();
  };

  const triggerLabelInteraction = () => {
    if (data?.onLabelClick) {
      data.onLabelClick();
    } else {
      data?.onEdgeClick?.();
    }
  };

  const handleLabelClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    triggerLabelInteraction();
  };

  const edgeGroup = (
    <g className="react-flow__edge">
      <path
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          stroke,
          strokeWidth,
          strokeDasharray: data?.strokeDasharray,
          opacity,
        }}
      />
      <path
        d={edgePath}
        fill="none"
        className="pointer-events-auto"
        onClick={handleClick}
        style={{ stroke: "transparent", strokeWidth: Math.max(strokeWidth, 1) + 16 }}
      />
      {arrowPaths.map((arrowPath, index) => (
        <path
          key={`${id}-arrow-${index}`}
          d={arrowPath}
          fill={stroke}
          stroke={stroke}
          opacity={opacity}
          className="pointer-events-none"
        />
      ))}
      {data?.label ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelXAdjusted}px, ${labelYAdjusted}px)`,
              pointerEvents: "auto",
              fontSize: data.label.fontSize,
              fontWeight: 500,
              color: data.label.textColor,
              background: data.label.background,
              padding: `${data.label.padding}px ${data.label.padding}px`,
              borderRadius: data.label.borderRadius,
              border:
                data.label.borderWidth > 0
                  ? `${data.label.borderWidth}px solid ${data.label.borderColor}`
                  : "none",
              lineHeight: 1,
              whiteSpace: "nowrap",
              boxShadow: "0 1px 4px rgba(15, 23, 42, 0.12)",
              cursor: "text",
            }}
            onClick={handleLabelClick}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                triggerLabelInteraction();
              }
            }}
          >
            {data.label.text}
          </div>
        </EdgeLabelRenderer>
      ) : tooltipText.trim() !== "" ? (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              fontSize: 10,
              fontWeight: 500,
              color: "#1f2937",
              background: "rgba(255,255,255,0.9)",
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid rgba(209,213,219,0.6)",
            }}
            className="select-none shadow-sm"
          >
            {tooltipText}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </g>
  );

  if (!tooltipText.trim()) {
    return edgeGroup;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{edgeGroup}</TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ConnectionPreviewEdge;
