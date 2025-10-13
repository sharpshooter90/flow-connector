import React from "react";
import { Handle, NodeProps, Position } from "reactflow";

interface PreviewFrameNodeData {
  width: number;
  height: number;
  label: string;
  muted?: boolean;
}

const PreviewFrameNode: React.FC<NodeProps<PreviewFrameNodeData>> = ({
  data,
}) => {
  return (
    <div
      className={`relative flex h-full w-full items-center justify-center rounded-md border-2 text-[10px] font-medium shadow-sm transition-all ${
        data.muted
          ? "border-gray-300 bg-gray-200 text-gray-400"
          : "border-blue-700 bg-blue-600 text-white"
      }`}
      style={{
        width: data.width,
        height: data.height,
        opacity: data.muted ? 0.4 : 1,
      }}
    >
      {data.label}
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
