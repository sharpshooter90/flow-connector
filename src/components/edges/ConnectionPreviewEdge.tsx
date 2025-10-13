import React from "react";
import {
  EdgeLabelRenderer,
  EdgeProps,
  Position,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
} from "reactflow";
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
  arrowheads?: Array<"start" | "end">;
  label?: PreviewEdgeLabel | null;
  tooltip?: string;
  onEdgeClick?: () => void;
  onLabelClick?: () => void;
  pathType?: "bezier" | "smoothstep" | "straight";
  borderRadius?: number;
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
  const [bezierPath, baseLabelX, baseLabelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  let edgePath = bezierPath;
  let labelX = baseLabelX;
  let labelY = baseLabelY;

  if (data?.pathType === "smoothstep") {
    const [smoothPath, smoothLabelX, smoothLabelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: data?.borderRadius ?? 12,
    });
    edgePath = smoothPath;
    labelX = smoothLabelX;
    labelY = smoothLabelY;
  } else if (data?.pathType === "straight") {
    const [straightPath, straightLabelX, straightLabelY] = getStraightPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    edgePath = straightPath;
    labelX = straightLabelX;
    labelY = straightLabelY;
  } else if (
    !data?.pathType &&
    data?.path &&
    !data.path.includes("NaN") &&
    data.path.trim().length > 0
  ) {
    edgePath = data.path;
  }
  const stroke = data?.stroke ?? "#1d4ed8";
  const strokeWidth = data?.strokeWidth ?? 2;
  const opacity = data?.opacity ?? 1;
  const tooltipText = data?.tooltip ?? data?.label?.text ?? "";
  const arrowheads = data?.arrowheads ?? [];
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

  const arrowSize = Math.max(strokeWidth * 2, 10);

  const buildArrowPath = (
    x: number,
    y: number,
    position: Position,
    size: number
  ) => {
    switch (position) {
      case Position.Left:
        return `M ${x} ${y} L ${x + size} ${y - size / 2} L ${x + size} ${
          y + size / 2
        } Z`;
      case Position.Right:
        return `M ${x} ${y} L ${x - size} ${y - size / 2} L ${x - size} ${
          y + size / 2
        } Z`;
      case Position.Up:
        return `M ${x} ${y} L ${x - size / 2} ${y + size} L ${x + size / 2} ${
          y + size
        } Z`;
      case Position.Down:
        return `M ${x} ${y} L ${x - size / 2} ${y - size} L ${x + size / 2} ${
          y - size
        } Z`;
      default:
        return `M ${x} ${y} L ${x + size} ${y - size / 2} L ${x + size} ${
          y + size / 2
        } Z`;
    }
  };

  const arrowElements = arrowheads.map((type, index) => {
    const isEnd = type === "end";
    const position = isEnd ? targetPosition : sourcePosition;
    const x = isEnd ? targetX : sourceX;
    const y = isEnd ? targetY : sourceY;
    const path = buildArrowPath(x, y, position, arrowSize);

    return (
      <path
        key={`${id}-arrow-${type}-${index}`}
        d={path}
        fill={stroke}
        stroke={stroke}
        opacity={opacity}
        className="pointer-events-none"
      />
    );
  });

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
      {arrowElements}
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
